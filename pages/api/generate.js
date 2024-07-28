import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils.js";
import { authenticate } from "utils/authUtils";
import { verifySessionId } from "utils/sessionUtils";
import { getUacResult } from "utils/uacUtils";
import { countToken } from "utils/tokenUtils";
import { getSystemConfigurations } from "utils/sysUtils";
import { ensureSession } from "utils/logUtils";
import { getUser } from "utils/sqliteUtils";
import { executeFunctions, getTools } from "function.js";

// OpenAI
const openai = new OpenAI();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// System configurations
// model
// model_v
// role_content_system
// welcome_message
// querying
// generating
// searching
// waiting
// init_placeholder
// enter
// temperature
// top_p
// max_tokens
// use_function_calling
// use_node_ai
// use_payment
// use_access_control
// use_email
// minimalist
const sysconf = getSystemConfigurations();

export default async function(req, res) {
  // Input
  let input = req.body.user_input.trim() || "";
  let inputType = TYPE.NORMAL;
  const images = req.body.images || null;
  const files = req.body.files || null;

  // Output
  let output = "";
  let outputType = TYPE.NORMAL;

  // Config (input)
  /*  1 */ const time_ = req.body.time || "";
  /*  2 */ const session = req.body.session || "";
  /*  3 */ const mem_length = req.body.mem_length || 0;
  /*  4 */ const functions_ = req.body.functions || "";
  /*  5 */ const role = req.body.role || "";
  /*  6 */ const store = req.body.store || "";
  /*  7 */ const node = req.body.node || "";
  /*  8 */ const use_stats = req.body.use_stats || false;
  /*  9 */ const use_eval_ = req.body.use_eval || false;
  /* 10 */ const use_location = req.body.use_location || false;
  /* 11 */ const location = req.body.location || "";
  /* 12 */ const lang = req.body.lang || "en-US";
  /* 13 */ const use_system_role = req.body.use_system_role || false;

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
  const use_vision = images && images.length > 0;
  const model = use_vision ? sysconf.model_v : sysconf.model;
  const use_eval = use_eval_ && use_stats && !use_vision;

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
    + "role_content_system (chat): " + sysconf.role_content_system.replaceAll("\n", " ") + "\n"
    + "max_tokens: " + sysconf.max_tokens + "\n"
    + "use_vision: " + use_vision + "\n"
    + "use_eval: " + use_eval + "\n"
    + "use_function_calling: " + sysconf.use_function_calling + "\n"
    + "use_node_ai: " + sysconf.use_node_ai + "\n"
    + "use_lcation: " + use_location + "\n"
    + "location: " + (use_location ? (location === "" ? "___" : location) : "(disabled)") + "\n"
    + "functions: " + (functions_ || "___") + "\n"
    + "role: " + (role || "___") + "\n"
    + "store: " + (store || "___") + "\n"
    + "node: " + (node || "___") + "\n");
  }

  // Type II. Tool calls (function calling) input
  let functionNames = [];
  let functionCalls = [];
  let functionResults = [];
  if (input.startsWith("!")) {
    if (!use_function_calling) {
      console.log(chalk.redBright("Error: function calling is not enabled."));
      res.status(500).json({
        success: false,
        error: "Function calling is not enabled.",
      });
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

        // TODO: add function frontend events
        // Maybe in the final result
      }
    }
  }

  try {
    let token_ct;  // input token count
    let messages = [];
    let mem = 0;

    // Messages
    const generateMessagesResult = await generateMessages(use_system_role, lang,
                                                          user, model,
                                                          input, inputType, files, images,
                                                          session, mem_length,
                                                          role, store, node,
                                                          use_location, location, 
                                                          sysconf.use_function_calling, functionCalls, functionResults,
                                                          null, null);

    token_ct = generateMessagesResult.token_ct;
    messages = generateMessagesResult.messages;
    mem = generateMessagesResult.mem;

    // Tools
    console.log("--- tools ---");
    let tools = await getTools(functions_);
    console.log(JSON.stringify(tools) + "\n");

    console.log("--- messages ---");
    console.log(JSON.stringify(messages) + "\n");

    // OpenAI API key check
    if (!OPENAI_API_KEY) {
      console.log(chalk.redBright("Error: OpenAI API key is not set."));
      res.status(500).json({
        success: false,
        error: "OpenAI API key is not set.",
      });
      return;
    }

    // OpenAI chat completion!
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model,
      frequency_penalty: 0,
      logit_bias: null,
      logprobs: null,
      top_logprobs: null,
      max_tokens: sysconf.max_tokens,
      n: 1,
      presence_penalty: 0,
      response_format: null,
      seed: null,
      service_tier: null,
      stop: "###STOP###",
      stream: false,
      stream_options: null,
      temperature: sysconf.temperature,
      top_p: sysconf.top_p,
      tools: (sysconf.use_function_calling && tools && tools.length > 0) ? tools : null,
      tool_choice: (sysconf.use_function_calling && tools && tools.length > 0) ? "auto" : null,
      parallel_tool_calls: true,
      user: user ? user.username : null,
    });

    // Get result
    const choices = chatCompletion.choices;
    if (!choices || choices.length === 0) {
      console.log(chalk.redBright("Error (session = " + session + "):"));
      console.error("No choice\n");
      output = "Silent...";
    } else {
      output = choices[0].message.content;
    }

    // Output the result
    if (output.trim().length === 0) output = "(null)";
    console.log(chalk.blueBright("Output (session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log(output + "\n");

    // Log
    const input_token_ct = token_ct.total;
    const output_token_ct = countToken(model, output);
    logadd(user, session, time, model, input_token_ct, input, output_token_ct, output, JSON.stringify(images), ip, browser);

    res.status(200).json({
      result: {
        text : output,
        stats: {
          temperature: sysconf.temperature,
          top_p: sysconf.top_p,
          token_ct: input_token_ct,
          mem: mem,
          func: false,
          role: role,
          store: store,
          node: node,
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
