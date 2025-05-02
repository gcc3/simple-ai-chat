import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils";
import { evaluate } from './evaluate';
import { executeFunctions, getTools } from "function.js";
import { countToken } from "utils/tokenUtils";
import { verifySessionId } from "utils/sessionUtils";
import { authenticate } from "utils/authUtils";
import { getUacResult } from "utils/uacUtils";
import { getModels, getUser } from "utils/sqliteUtils";
import { getSystemConfigurations } from "utils/sysUtils";
import { findNode } from "utils/nodeUtils.js";
import { ensureSession } from "utils/logUtils.js";
import { addUserUsage } from "utils/sqliteUtils.js";

// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// System configurations
const sysconf = getSystemConfigurations();

// Models
let models = await getModels();

export default async function (req, res) {
  // Input
  let input = req.query.user_input.trim() || "";
  let inputType = TYPE.NORMAL;

  // Input: Images & files
  const decodedImages = req.query.images || "";
  const decodedFiles = req.query.files || "";
  let images = [];
  let files = [];
  if (decodedImages) {
    if (decodedImages.includes("###")) {
      images = decodedImages.split("###");
    } else {
      images.push(decodedImages);
    }
  }
  if (decodedFiles) {
    if (decodedFiles.includes("###")) {
      files = decodedFiles.split("###");
    } else {
      files.push(decodedFiles);
    }
  }

  // If input is all empty, return
  if (input.trim().length === 0 && images.length == 0 && files.length == 0) {
    console.log("Input is empty.");
    return;
  }

  // Output
  let output = "";
  let outputType = TYPE.NORMAL;

  // Config (input)
  const time_ = req.query.time || "";
  const session = req.query.session || "";
  const mem_length = req.query.mem_length || 0;
  const functions_ = req.query.functions || "";
  const role = req.query.role || "";
  const stores = req.query.stores || "";
  const node = req.query.node || "";
  const use_stats = req.query.use_stats === "true" ? true : false;
  const use_eval_ = req.query.use_eval === "true" ? true : false;
  const use_location = req.query.use_location === "true" ? true : false;
  const location = req.query.location || "";
  const lang = req.query.lang || "en-US";
  const use_system_role = req.query.use_system_role === "true" ? true : false;

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
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
  updateStatus("Preparing...");
  
  // Session ID
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.write(`data: ${verifyResult.message}\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Load node
  const nodeInfo = user && await findNode(node, user.username);

  // Model switch
  let model = req.query.model || sysconf.model;
  const use_vision = images && images.length > 0;
  const use_eval = use_eval_ && use_stats && !use_vision;

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
    const uacResult = await getUacResult(user, ip);
    if (!uacResult.success) {
      res.write(`data: ${uacResult.error}\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }
  }

  // Type I. Normal input
  if (!input.startsWith("!")) {
    inputType = TYPE.NORMAL;
    console.log(chalk.yellowBright("\nInput (session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log(input + "\n");

    // Images & files
    if (images && images.length > 0) {
      console.log("--- images ---");
      console.log(images.join("\n") + "\n");
    }
    if (files && files.length > 0) {
      console.log("--- files ---");
      console.log(files.join("\n") + "\n");
    }

    // Configuration info
    console.log("--- configuration info ---\n"
    + "lang: " + lang + "\n"
    + "model: " + model + "\n"
    + "temperature: " + sysconf.temperature + "\n"
    + "top_p: " + sysconf.top_p + "\n"
    + "role_content_system (chat): " + sysconf.role_content_system.replaceAll("\n", " ") + "\n"
    + "use_vision: " + use_vision + "\n"
    + "use_eval: " + use_eval + "\n"
    + "use_function_calling: " + sysconf.use_function_calling + "\n"
    + "use_node_ai: " + sysconf.use_node_ai + "\n"
    + "use_lcation: " + use_location + "\n"
    + "location: " + (use_location ? (location === "" ? "___" : location) : "(disabled)") + "\n"
    + "functions: " + (functions_ || "___") + "\n"
    + "role: " + (role || "___") + "\n"
    + "stores: " + (stores || "___") + "\n"
    + "node: " + (node || "___") + "\n");
  }

  // Type II. Tool calls (function calling) input
  // Tool call input starts with "!" with fucntions, following with a user input starts with "Q="
  // Example: !func1(param1),!func2(param2),!func3(param3) Q=Hello
  let functionNames = [];    // functionc called
  let functionCalls = [];    // function calls in input
  let functionResults = [];  // function call results
  if (input.startsWith("!")) {
    if (!sysconf.use_function_calling) {
      res.write(`data: Function calling is disabled.\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }

    inputType = TYPE.TOOL_CALL;
    console.log(chalk.cyanBright("Tool calls (session = " + session + (user ? ", user = " + user.username : "") + "):"));
 
    // Curerently OpenAI only support function calling in tool calls.
    // Function name and arguments
    const functions = input.split("T=")[0].trim().substring(1).split(",!");
    console.log("Functions: " + JSON.stringify(functions));

    // Tool calls
    functionCalls = JSON.parse(input.split("T=")[1].trim().split("Q=")[0].trim());

    // Replace input with original
    input = input.split("Q=")[1];

    // Execute function
    functionResults = await executeFunctions(functions);
    console.log("Result:" + JSON.stringify(functionResults) + "\n");
    if (functionResults.length > 0) {
      for (let i = 0; i < functionResults.length; i++) {
        const f = functionResults[i];
        const c = functionCalls[i];  // not using here.

        // Add function name
        const functionName = f.function.split("(")[0].trim();
        if (functionNames.indexOf(functionName) === -1) {
          functionNames.push(functionName);
        }

        // Trigger event
        // Function trigger event
        if (f.event) {
          const event = JSON.stringify(f.event);
          res.write(`data: ###EVENT###${event}\n\n`);  // send event to frontend
        }
      }
    }
  }

  try {
    let token_ct = [];  // detailed token count
    let input_token_ct = 0;
    let output_token_ct = 0;
    let input_images = [];
    let node_input = "";
    let node_output = "";
    let node_output_images = [];
    let toolCalls = [];

    // Messages
    updateStatus("Start pre-generating...");
    const msg = await generateMessages(use_system_role, lang,
                                       user, model,
                                       input, inputType, files, images, 
                                       session, mem_length,
                                       role, stores, node, 
                                       use_location, location,
                                       sysconf.use_function_calling, functionCalls, functionResults,

                                       // these 2 are callbacks
                                       updateStatus, streamOutput);

    updateStatus("Pre-generating finished.");
    token_ct.push(msg.token_ct);
    input_token_ct += msg.token_ct.total;
    input_images = msg.input_images;
    
    node_input = msg.node_input;
    node_output = msg.node_output;
    node_output_images = msg.node_output_images;

    if (node && nodeInfo) {
      const settings = JSON.parse(nodeInfo.settings);
      const nodeModel = settings.model || node;

      // Add log for node
      // Use node as model name, TODO, use node response model name
      // For each image add a log
      if (node_input) {
        if (node_output_images.length > 0) {
          for (let i = 0; i < node_output_images.length; i++) {
            // The time cannot be same, so every image add 1 millisecond
            await logadd(user, session, time++, nodeModel, 0, ":generate \"" + node_input + "\"", 0, node_output, JSON.stringify([node_output_images[i]]), ip, browser);
          }
        } else {
          await logadd(user, session, time++, nodeModel, 0, node_input, 0, node_output, JSON.stringify([]), ip, browser);
        }
      }
    }

    // Tools
    console.log("--- tools ---");
    let tools = await getTools(functions_);
    console.log(JSON.stringify(tools) + "\n");

    console.log("--- messages ---");
    console.log(JSON.stringify(msg.messages) + "\n");

    // endpoint: /v1/chat/completions
    updateStatus("Create chat completion.");

    // Model setup
    let modelInfo = models.find(m => m.name === model);
    if (!modelInfo) {
      // Try update models
      models = await getModels();

      if (models.length === 0) {
        // Developer didn't setup models table
        modelInfo = {
          name: process.env.MODEL,
          api_key: process.env.OPENAI_API_KEY,
          base_url: process.env.OPENAI_BASE_URL,
          price_input: 0,
          price_output: 0,
        }
      } else {
        // Already setup models but not found
        modelInfo = models.find(m => m.name === model);
        if (!modelInfo) {
          updateStatus("Model not exists.");
          res.write(`data: ###ERR###Model not exists.\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
          return;
        }
      }
    }

    const apiKey = modelInfo.api_key;
    if (!apiKey) {
      updateStatus("Model's API key is not set.");
      res.write(`data: ###ERR###Model's API key is not set.\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    // OpenAI API base URL check
    const baseUrl = modelInfo.base_url;
    if (!baseUrl) {
      updateStatus("Model's base URL is not set.");
      res.write(`data: ###ERR###Model's base URL is not set.\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    // OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    });

    // OpenAI chat completion!
    let chatCompletionUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const chatCompletion = await openai.chat.completions.create({
      messages: msg.messages,
      model,
      n: 1,
      presence_penalty: 0,
      response_format: null,
      stream: true,
      stream_options: {
        include_usage: true,
      },
      temperature: sysconf.temperature,
      top_p: sysconf.top_p,
      tools: (sysconf.use_function_calling && tools && tools.length > 0) ? tools : null,
      tool_choice: (sysconf.use_function_calling && tools && tools.length > 0) ? "auto" : null,
      user: user ? user.username : null,
    });

    res.write(`data: ###MODEL###${model}\n\n`);
    res.write(`data: ###STATS###${sysconf.temperature},${sysconf.top_p},${input_token_ct + output_token_ct},${use_eval},${functionNames.join('|')},${role},${stores.replaceAll(",","|")},${node},${msg.mem}\n\n`);

    // Print input images
    input_images.map(image => {
      res.write(`data: ###IMG###${image}\n\n`);
    });
    res.flush();

    // Hanldle output
    for await (const part of chatCompletion) {
      if (!part.choices) {
        continue;
      }

      if (part.choices.length > 0) {
        // 1. handle message output
        const content = part.choices[0].delta.content;
        if (content) {
          outputType = TYPE.NORMAL;
          output += content;
          streamOutput(content);
        }

        // 2. handle tool calls output
        const tool_calls = part.choices[0].delta.tool_calls;
        if (tool_calls) {
          outputType = TYPE.TOOL_CALL;
          res.write(`data: ###CALL###${JSON.stringify(tool_calls)}\n\n`); res.flush();

          const toolCall = tool_calls[0];
          const toolCallSameIndex = toolCalls.find(t => t.index === toolCall.index);
          if (toolCallSameIndex) {
            // Found same index tool
            toolCallSameIndex.function.arguments += toolCall.function.arguments;
          } else {
            // If not found, add the tool
            toolCalls.push(toolCall);
          }
        }
      }

      // For the last part, it will include the usage
      if (part.usage) {
        chatCompletionUsage = part.usage;
      }
    }

    // Evaluate result
    // vision models not support evaluation
    if (use_eval) {
      if (output.trim().length > 0) {
        const evalResult = await evaluate(user, input, msg.raw_prompt, output);
        if (evalResult.success) {
          res.write(`data: ###EVAL###${evalResult.output}\n\n`); res.flush();
          console.log("eval: " + evalResult.output + "\n");
          output_token_ct += evalResult.token_ct;
        } else {
          res.write(`data: ###EVAL###${evalResult.error}\n\n`); res.flush();
        }
      }
    }

    // Output
    console.log(chalk.blueBright("Output (session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log((output || "(null)") + "\n");

    // Tool calls output
    const output_tool_calls = JSON.stringify(toolCalls);
    if (output_tool_calls && toolCalls.length > 0) {
      console.log("--- tool calls ---");
      console.log(output_tool_calls + "\n");
    }

    // Log (chat history)
    // Must add tool calls log first, then add the general input output log
    // 1. tool calls log
    if (functionCalls && functionCalls.length > 0 && functionResults && functionResults.length > 0) {
      for (let i = 0; i < functionResults.length; i++) {
        const f = functionResults[i];
        const c = functionCalls[i];

        // Add log
        if (c.type === "function" && c.function && c.function.name === f.function.split("(")[0].trim()) {
          const input_f = "F=" + JSON.stringify(c);
          let output_f = f.success ? "F=" + f.message : "F=Error: " + f.error;
          const input_token_ct_f = countToken(model, input_f);
          const output_token_ct_f = countToken(model, output_f);
          await logadd(user, session, time++, model, input_token_ct_f, input_f, output_token_ct_f, output_f, JSON.stringify([]), ip, browser);
        }
      }
    }

    // 2. general input/output log
    output_token_ct += countToken(model, output);
    if (inputType === TYPE.TOOL_CALL) {
      // Function calling input is already logged
      input_token_ct = 0;
      input = "Q=" + input;
    }
    if (outputType === TYPE.TOOL_CALL) {
      // Add tool calls output to log
      output = "T=" + output_tool_calls;
    }
    if (files.length > 0 && msg.file_content) {
      input += "\n\n" + msg.file_content;
    }

    // Token
    console.log("--- token_ct ---");
    console.log(JSON.stringify(token_ct));
    console.log("output_token_ct: " + output_token_ct);
    console.log("response_token_ct: " + JSON.stringify(chatCompletionUsage) + "\n");

    // Fee
    console.log("--- fee_calc ---");
    const input_fee = chatCompletionUsage.prompt_tokens * modelInfo.price_input;
    const output_fee = chatCompletionUsage.completion_tokens * modelInfo.price_output;
    const total_fee = input_fee + output_fee;
    console.log("input_fee = " + chatCompletionUsage.prompt_tokens + " * " + modelInfo.price_input + " = " + input_fee.toFixed(5));
    console.log("output_fee = " + chatCompletionUsage.completion_tokens + " * " + modelInfo.price_output + " = " + output_fee.toFixed(5));
    console.log("total_fee: " + total_fee.toFixed(5));
    if (user && user.username) {
      await addUserUsage(user.username, parseFloat(total_fee.toFixed(6)));
      console.log("💰 User usage added, user: " + user.username + ", fee: " + total_fee.toFixed(5) + "\n");
    }

    // Log
    await logadd(user, session, time++, model, chatCompletionUsage.prompt_tokens, input, chatCompletionUsage.completion_tokens, output, JSON.stringify(input_images), ip, browser);

    // Stats (final)
    res.write(`data: ###STATS###${sysconf.temperature},${sysconf.top_p},${chatCompletionUsage.total_tokens},${use_eval},${functionNames.join('|')},${role},${stores.replaceAll(",","|")},${node},${msg.mem}\n\n`);
    
    // Done message
    updateStatus("Finished.");
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  } catch (error) {
    console.log("Error (Generate SSE API):");
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
