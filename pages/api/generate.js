import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils.js";
import { authenticate } from "utils/authUtils";
import { verifySessionId } from "utils/sessionUtils";
import { getUacResult } from "utils/uacUtils";
import { countToken } from "utils/tokenUtils";
import { getSystemConfigurations } from "utils/systemUtils";
import { ensureSession } from "utils/logUtils";
import { getUser, addUserUsage } from "utils/sqliteUtils";
import { executeFunctions, getTools } from "function.js";
import { evaluate } from './evaluate';
import { getModels } from "utils/sqliteUtils.js";
import { printRequest } from "utils/printUtils";

// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// System configurations
const sysconf = getSystemConfigurations();

// Models
let models = await getModels();

export default async function(req, res) {
  // Input
  let input = req.body.user_input.trim() || "";
  let inputType = TYPE.NORMAL;
  const images = req.body.images || null;
  const files = req.body.files || null;

  // Output
  let output = "";
  let outputType = TYPE.NORMAL;
  let eval_ = "";
  let toolCalls = [];
  let events = [];

  // Config (input)
  const time_ = req.body.time || "";
  const session = req.body.session || "";
  const mem_length = req.body.mem_length || 0;
  const functions_ = req.body.functions || "";
  const role = req.body.role || "";
  const stores = req.body.stores || "";
  const node = req.body.node || "";
  const use_stats = req.body.use_stats || false;
  const use_eval_ = req.body.use_eval || false;
  const use_location = req.body.use_location || false;
  const location = req.body.location || "";
  const lang = req.body.lang || "en-US";
  const use_system_role = req.body.use_system_role || true;

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

  // Session
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.status(400).json({
      success: false,
      error: verifyResult.message,
    });
    return;
  }

  // Model switch
  let model = req.body.model || sysconf.model;
  const use_vision = images && images.length > 0;
  const use_eval = use_eval_ && use_stats && !use_vision;

  // Use function calling
  let use_function_calling = sysconf.use_function_calling;

  // User access control
  if (sysconf.use_access_control) {
    const uacResult = await getUacResult(user, ip);
    if (!uacResult.success) {
      res.status(400).json({
        success: false,
        error: uacResult.error,
      });
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
    + "use_system_role: " + use_system_role + "\n"
    + "role_content_system (chat): " + sysconf.role_content_system.replaceAll("\n", " ") + "\n"
    + "use_vision: " + use_vision + "\n"
    + "use_eval: " + use_eval + "\n"
    + "use_function_calling: " + sysconf.use_function_calling + "\n"
    + "use_node_ai: " + sysconf.use_node_ai + "\n"
    + "use_location: " + use_location + "\n"
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
    if (!use_function_calling) {
      console.log(chalk.redBright("Error: function calling is disabled."));
      res.status(500).json({
        success: false,
        error: "Function calling is disabled.",
      });
      return;
    }

    inputType = TYPE.TOOL_CALL;
    console.log(chalk.cyanBright("\nInput Tool Calls (session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log(input);

    // OpenAI support function calling in tool calls.
    console.log("\n--- function calling ---");
    
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
          events.push(f.event);
        }
      }
    }
  }

  try {
    let input_images = [];

    // Messages
    const msg = await generateMessages(use_system_role, lang,
                                       user, model,
                                       input, inputType, files, images,
                                       session, mem_length,

                                       // Role, Stores, Node
                                       role, stores, node,

                                       // Location info
                                       use_location, location,

                                       // Function calling
                                       sysconf.use_function_calling,
                                       functionCalls, functionResults,
                                      
                                       // Callbacks
                                       null, null);
    
    input_images = msg.input_images;

    // Tools
    console.log("--- tools ---");
    let tools = await getTools(functions_);
    console.log(JSON.stringify(tools) + "\n");

    console.log("--- messages ---");
    console.log(JSON.stringify(msg.messages) + "\n");

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
    const chatCompletion = await openai.chat.completions.create({
      messages: msg.messages,
      model,
      n: 1,
      presence_penalty: 0,
      response_format: null,
      stream: false,
      stream_options: null,
      temperature: sysconf.temperature,
      top_p: sysconf.top_p,
      tools: (sysconf.use_function_calling && tools && tools.length > 0) ? tools : null,
      tool_choice: (sysconf.use_function_calling && tools && tools.length > 0) ? "auto" : null,
      user: user ? user.username : null,
    });

    // Get result
    const choices = chatCompletion.choices;
    if (!choices || choices.length === 0 || choices[0].message === null) {
      console.log(chalk.redBright("Error (session = " + session + "):"));
      console.error("No choice\n");
      output = "Silent...";
    } else {
      // 1. handle message output
      const content = choices[0].message.content;
      if (content) {
        outputType = TYPE.NORMAL;
        output += choices[0].message.content;
      }

      // 2. handle tool call output
      const tool_calls = choices[0].message.tool_calls
      if (tool_calls) {
        outputType = TYPE.TOOL_CALL;
        toolCalls = choices[0].message.tool_calls
      }
    }

    // Evaluate result
    // vision models not support evaluation
    if (use_eval) {
      if (output.trim().length > 0) {
        const evalResult = await evaluate(user, input, msg.raw_prompt, output);
        if (evalResult.success) {
          eval_ = evalResult.output;
          console.log("eval: " + evalResult.output + "\n");
        } else {
          eval_ = evalResult.error;
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
    // 1. tool calls
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
    if (inputType === TYPE.TOOL_CALL) {
      // Function calling input is already logged
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
    console.log("response_token_ct: " + JSON.stringify(chatCompletion.usage) + "\n");

    // Fee
    console.log("--- fee_calc ---");
    const input_fee = chatCompletion.usage.prompt_tokens * modelInfo.price_input;
    const output_fee = chatCompletion.usage.completion_tokens * modelInfo.price_output;
    const total_fee = input_fee + output_fee;
    console.log("input_fee = " + chatCompletion.usage.prompt_tokens + " * " + modelInfo.price_input + " = " + input_fee.toFixed(5));
    console.log("output_fee = " + chatCompletion.usage.completion_tokens + " * " + modelInfo.price_output + " = " + output_fee.toFixed(5));
    console.log("total_fee: " + total_fee.toFixed(5));
    if (user && user.username) {
      await addUserUsage(user.username, parseFloat(total_fee.toFixed(6)));
      console.log("💰 User usage added, user: " + user.username + ", fee: " + total_fee.toFixed(5) + "\n");
    }

    // Log
    await logadd(user, session, time++, model, chatCompletion.usage.prompt_tokens, input, chatCompletion.usage.completion_tokens, output, JSON.stringify(input_images), ip, browser);

    // Result
    res.status(200).json({
      result: {
        text : output,
        tool_calls: toolCalls,
        events: events,
        stats: {
          temperature: sysconf.temperature,
          top_p: sysconf.top_p,
          token_ct: chatCompletion.usage.total_tokens,
          mem: msg.mem,
          func: functionNames.join('|'),
          role: role,
          store: stores,
          node: node,
          eval: eval_
        },
        info: {
          model: model,
        }
      },
    });
  } catch (error) {
    console.error("Error (Generate API):");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json({
        success: false,
        error: error.response.data
      });
    } else {
      console.error(`${error.message}`);
      res.status(500).json({
        success: false,
        error: "An error occurred during your request.",
      });
    }
  }
}
