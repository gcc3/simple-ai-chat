import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "ai/context/prompt";
import { logadd } from "utils/server/log";
import { executeFunctions, getTools } from "ai/function.js";
import { countToken } from "utils/token";
import { verifySessionId } from "utils/session";
import { authenticate } from "utils/auth";
import { getUacResult } from "utils/uac";
import { getModels, getUser } from "utils/sqlite";
import { getSystemConfigurations } from "utils/server/system";
import { ensureSession } from "utils/server/log.js";
import { addUserUsage } from "utils/sqlite.js";
import { extractIpTag, isLocalRequestIp } from "utils/ip.js";
import { TYPE } from '../../../constants.js';
import log from "../../../log.js";

// System configurations
const sysconf = getSystemConfigurations();

// Models
let models = await getModels();

// Generate short
export default async function (req, res) {
  // Access log
  log(req);

  res.writeHead(200, {
    'connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',  // disables proxy buffering for NGINX
    // IMPORTANT! without this the stream not working on remote server
  });

  // Update stats callback
  const updateStatus = (status) => {
    res.write(`data: ###STATUS###${status}\n\n`); res.flush();
  }

  // Input
  // Stripped of its `@ip[...]` tag before anything else looks at it, so the tag reaches
  // neither the model nor the log; `taggedIp` is the user the bridge sent it for.
  const tagged = extractIpTag(req.query.user_input);
  let input_ = tagged.text;
  const taggedIp = tagged.ip;
  let inputType = TYPE.Normal;

  // If input is all empty, return
  if (input_ === "") {
    updateStatus("Input empty.");
    console.error("\nInput cannot be empty.");
    res.write(`data: ###ERR###Input cannot be empty.\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Output
  let output = "";
  let outputType = TYPE.Normal;

  // Config (input)
  const time_ = req.query.time || "";
  const session = req.query.session || "";
  const mem_length = req.query.mem_length || 0;
  const role = req.query.role || "";
  const stores = req.query.stores || "";
  const node_ = req.query.node || "";
  const use_location = req.query.use_location === "true" ? true : false;
  const location = req.query.location || "";
  const lang = req.query.lang || "";
  const use_system_role = req.query.use_system_role || true;

  // Request info
  // A tag is only honoured on a request from this machine — that is the bridge, running
  // the CLI on someone's behalf, and the only party entitled to name a different user.
  // Anything arriving from elsewhere speaks for itself, so its own address wins and a tag
  // it carries is just text somebody typed.
  const requestIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const ip = isLocalRequestIp(requestIp) && taggedIp ? taggedIp : requestIp;
  const browser = req.headers['user-agent'];

  // Time
  let time = Number(time_);

  // Authentication
  const authResult = authenticate(req);
  let user = null;
  let authUser = null;
  if (authResult.success) {
    authUser = authResult.user;
    user = await getUser(authResult.user.username);
  }

  // Ensure session
  // In sessions table, create session if not exists
  await ensureSession(session, user ? user.username : "");

  updateStatus("Preparing...");

  // Session ID
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.write(`data: ###ERR###${verifyResult.message}\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Model switch
  let model_ = req.query.model || sysconf.model;
  let model = models.find(m => m.name === model_);

  // Already setup models but not found
  if (!model) {
    // Try update models
    models = await getModels();
    model = models.find(m => m.name === model_);
    if (!model) {
      updateStatus("Model not exists.");
      res.write(`data: ###ERR###Model not exists.\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }
  }

  // Model properties
  const is_tool_calls_supported_model = model.is_tool_calls_supported === "1";
  const is_reasoning_model = model.is_reasoning === "1";

  // Function calling (tool calls), MCP tools
  let functions_ = req.query.functions || "";
  let mcp_tools = req.query.mcp_tools || "[]";
  if (!is_tool_calls_supported_model) {
    functions_ = "";
    mcp_tools = "[]";
  }

  // Model API key check
  if (!model.api_key) {
    updateStatus("Model's API key is not set.");
    res.write(`data: ###ERR###Model's API key is not set.\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  // Model API base URL check
  if (!model.base_url) {
    updateStatus("Model's base URL is not set.");
    res.write(`data: ###ERR###Model's base URL is not set.\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  // OpenAI
  const openai = new OpenAI({
    apiKey: model.api_key,
    baseURL: model.base_url,
  });

  // Stream output
  const streamOutput = (message, model = null) => {
    message = message.replaceAll("\n", "###RETURN###");
    res.write(`data: ${message}\n\n`); res.flush();

    if (model) {
      res.write(`data: ###MODEL###${model}\n\n`); res.flush();
    }
  }

  // User access control
  if (sysconf.use_access_control) {
    const uacResult = await getUacResult(user, ip, session, input_);
    if (!uacResult.success) {
      res.write(`data: ###ERR###${uacResult.error}\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }
  }

  // Type I. Normal input
  let functionNames = [];
  let functionCalls = [];
  let functionCallingResults = [];

  if (!input_.startsWith("!")) {
    inputType = TYPE.Normal;
    console.log(chalk.yellowBright("\nInput (short, session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log(input_);
  }

  // Type II. Tool calls (function calling) input
  if (input_.startsWith("!")) {
    inputType = TYPE.ToolCall;
    console.log(chalk.cyanBright("\nInput (short, toolcalls, session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log(input_);

    console.log("\n--- function calling ---");

    const functions = input_.split("T=")[0].trim().substring(1).split(",!");
    console.log("Functions: " + JSON.stringify(functions));

    const afterT = input_.split("T=")[1] ?? "";
    const beforeQ = afterT.split("Q=")[0];
    const rParts = beforeQ.split("R=");
    functionCalls = JSON.parse(rParts[0].trim());

    functionCallingResults = rParts.length > 1 ? JSON.parse(rParts[1].trim()) : [];
    if (functionCallingResults && functionCallingResults.length > 0) {
      console.log("Frontend function calling results: " + JSON.stringify(functionCallingResults));
    }

    if (functionCallingResults.length == 0) {
      functionCallingResults = await executeFunctions(functions, lang);
      console.log("Backend function calling result:" + JSON.stringify(functionCallingResults));

      if (functionCallingResults.length > 0) {
        for (let i = 0; i < functionCallingResults.length; i++) {
          const f = functionCallingResults[i];

          const functionName = f.function.split("(")[0].trim();
          if (functionNames.indexOf(functionName) === -1) {
            functionNames.push(functionName);
          }

          if (f.event) {
            const event = JSON.stringify(f.event);
            res.write(`data: ###EVENT###${event}\n\n`);
          }
        }
      }
    }

    input_ = input_.split("Q=")[1].trim();
  }

  try {
    let toolCalls = [];

    // Messages (with chat history)
    updateStatus("Start pre-generating...");
    const msg = await generateMessages(use_system_role, lang,
                                       user, model_,
                                       input_, inputType, [], [],
                                       session, mem_length,
                                       role, stores, node_,
                                       use_location, location,
                                       functionCalls, functionCallingResults,
                                       updateStatus, streamOutput);
    updateStatus("Pre-generating finished.");

    // Prepend the short-answer system prompt
    const messages = [
      {
        role: "system",
        content: "Reply in plain text only. No markdown, no code blocks, no extra explanation. Be as brief as possible while still being correct and helpful."
      },
      ...msg.messages,
    ];

    // Tools
    console.log("\n--- tools ---");
    let tools = getTools(functions_);
    let mcpTools = JSON.parse(mcp_tools);
    if (mcpTools && mcpTools.length > 0) {
      tools = tools.concat(mcpTools);
    }
    if (is_tool_calls_supported_model) {
      console.log(JSON.stringify(tools));
    } else {
      console.log("Model doesn't support tool calls.");
    }

    // endpoint: /v1/chat/completions
    updateStatus("Create chat completion.");

    // Reasoning model will start reasoning
    if (is_reasoning_model) {
      updateStatus("Start reasoning...");
    } else {
      updateStatus("Start generating...");
    }

    // OpenAI chat completion!
    let chatCompletionUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: model_,
      n: 1,
      stream: true,
      stream_options: {
        include_usage: true,
      },
      temperature: sysconf.temperature,

      // conditional params
      ...(is_tool_calls_supported_model && tools && tools.length > 0 ? { tools: tools, tool_choice: "auto" } : {}),
      ...(is_reasoning_model && is_tool_calls_supported_model && tools && tools.length > 0 ? { reasoning_effort: "none" } : {}),
      ...(user ? { user: user.username } : {})
    });

    res.write(`data: ###MODEL###${model_}\n\n`);
    res.flush();

    // Handle output
    for await (const part of chatCompletion) {
      if (!part.choices) {
        continue;
      }

      if (part.choices.length > 0) {
        const delta = part.choices[0].delta || {};

        // Handle message output
        const content = delta.content;
        if (typeof content === 'string' && content.length > 0) {
          outputType = TYPE.Normal;
          output += content;
          streamOutput(content);
        }

        // Handle tool calls output
        const tool_calls = Array.isArray(delta.tool_calls) ? delta.tool_calls : null;
        if (tool_calls && tool_calls.length > 0) {
          outputType = TYPE.ToolCall;
          res.write(`data: ###CALL###${JSON.stringify(tool_calls)}\n\n`); res.flush();

          const toolCall = tool_calls[0];
          if (toolCall) {
            const toolCallSameIndex = toolCalls.find(t => t.index === toolCall.index);
            if (toolCallSameIndex) {
              toolCallSameIndex.function.arguments += toolCall.function.arguments;
            } else {
              toolCalls.push(toolCall);
            }
          }
        }
      }

      // For the last part, it will include the usage
      if (part.usage) {
        chatCompletionUsage = part.usage;
      }
    }

    // Output
    console.log(chalk.blueBright("\nOutput (short, session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log((output.trim() || "(null)"));

    // Tool calls output
    const output_tool_calls = JSON.stringify(toolCalls);
    if (output_tool_calls && toolCalls.length > 0) {
      console.log("\n--- tool calls ---");
      console.log(output_tool_calls);
    }

    // Log (chat history)
    // 1. tool calls log
    if (functionCalls && functionCalls.length > 0 && functionCallingResults && functionCallingResults.length > 0) {
      for (let i = 0; i < functionCallingResults.length; i++) {
        const f = functionCallingResults[i];
        const c = functionCalls[i];

        if (c.type === "function" && c.function && c.function.name === f.function.split("(")[0].trim()) {
          const input_f = "F=" + JSON.stringify(c);
          let output_f = f.success ? "F=" + f.message : "F=Error: " + f.error;
          const input_token_ct_f = countToken(model_, input_f);
          const output_token_ct_f = countToken(model_, output_f);
          await logadd(user, session, time++, model_, input_token_ct_f, input_f, output_token_ct_f, output_f, JSON.stringify([]), 0, ip, browser);
        }
      }
    }

    // 2. general input/output log
    if (inputType === TYPE.ToolCall) {
      input_ = "Q=" + input_;
    }
    if (outputType === TYPE.ToolCall) {
      output = "T=" + output_tool_calls;
    }

    // Token
    console.log("\n--- token_ct ---");
    console.log("response_token_ct: " + JSON.stringify(chatCompletionUsage));

    // Fee
    console.log("\n--- fee_calc ---");
    const input_fee = chatCompletionUsage.prompt_tokens * model.price_input;
    const output_fee = chatCompletionUsage.completion_tokens * model.price_output;
    const cost = input_fee + output_fee;
    console.log("input_fee = " + chatCompletionUsage.prompt_tokens + " * " + model.price_input + " = " + input_fee.toFixed(5));
    console.log("output_fee = " + chatCompletionUsage.completion_tokens + " * " + model.price_output + " = " + output_fee.toFixed(5));
    console.log("total_cost: " + cost.toFixed(5));
    if (user && user.username) {
      await addUserUsage(user.username, parseFloat(cost.toFixed(6)));
      console.log("💰 User usage added, user: " + user.username + ", total cost: " + cost.toFixed(5));
    }

    // Log
    await logadd(user, session, time++, model_, chatCompletionUsage.prompt_tokens, input_, chatCompletionUsage.completion_tokens, output, "[]", parseFloat(cost.toFixed(6)), ip, browser);

    // Done message
    updateStatus("Finished.");
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  } catch (error) {
    console.log("Error (Generate short API):");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.write(`data: ###ERR###An error occurred during your request. (${error.response.status})\n\n`)
    } else {
      console.error(`${error.message}`);
      res.write(`data: ###ERR###An error occurred during your request.\n\n`)
    }
    res.flush();
    res.end();
  }
}
