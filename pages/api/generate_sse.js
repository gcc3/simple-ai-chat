import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils";
import { tryParseJSON } from "utils/jsonUtils"
import { evaluate } from './evaluate';
import { getFunctions, executeFunction } from "function.js";
import { getTools } from "tools.js";
import { getMaxTokens } from "utils/tokenUtils";
import { verifySessionId } from "utils/sessionUtils";
import { authenticate } from "utils/authUtils";
import { getUacResult } from "utils/uacUtils";

// OpenAI
const openai = new OpenAI();

// configurations
const model_ = process.env.MODEL ? process.env.MODEL : "";
const model_v = process.env.MODEL_V ? process.env.MODEL_V : "";
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : getMaxTokens(model_);
const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;
const use_node_ai = process.env.USE_NODE_AI == "true" ? true : false;
const force_node_ai_query = process.env.FORCE_NODE_AI_QUERY == "true" ? true : false;
const use_vector = process.env.USE_VECTOR == "true" ? true : false;
const use_access_control = process.env.USE_ACCESS_CONTROL == "true" ? true : false;
const use_email = process.env.USE_EMAIL == "true" ? true : false;

export default async function (req, res) {
  const queryId = req.query.query_id || "";
  const role = req.query.role || "";
  const store = req.query.store || "";
  const use_stats = req.query.use_stats === "true" ? true : false;
  const use_location = req.query.use_location === "true" ? true : false;
  const location = req.query.location || "";
  const images_ = req.query.images || "";
  const files_ = req.query.files || "";
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];

  // Authentication
  const authResult = authenticate(req);
  let user = null;
  let authUser = null;
  if (authResult.success) {
    authUser = authResult.user;
    user = await getUser(authResult.user.username);
  }

  // Input & output
  let input = "";
  let output = "";

  res.writeHead(200, {
    'connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',  // disables proxy buffering for NGINX
                                // IMPORTANT! without this the stream not working on remote server
  });
  
  // Query ID, same as session ID
  const verifyResult = verifySessionId(queryId);
  if (!verifyResult.success) {
    res.write(`data: ${verifyResult.message}\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Input
  input = req.query.user_input.replaceAll("%", "％").trim();  // escape %
  input = decodeURIComponent(input) || "";
  if (input.trim().length === 0) return;

  // Images & files
  const decodedImages = decodeURIComponent(images_) || "";
  const decodedFiles = decodeURIComponent(files_) || "";
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

  // Model switch
  const use_vision = images.length > 0;
  const model = use_vision ? model_v : model_;
  const use_eval = use_stats && !use_vision;

  // User access control
  if (use_access_control) {
    const uacResult = await getUacResult(user, ip);
    if (!uacResult.success) {
      res.write(`data: ${getUacResult.error}\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }
  }

  // I. Normal input
  if (!input.startsWith("!")) {
    console.log(chalk.yellowBright("Input (query_id = " + queryId + "):"));
    console.log(input + "\n");

    // Images & files
    if (images.length > 0) {
      console.log("--- images ---");
      console.log(images.join("\n") + "\n");
    }
    if (files.length > 0) {
      console.log("--- files ---");
      console.log(files.join("\n") + "\n");
    }

    // Configuration info
    console.log("--- configuration info ---\n" 
    + "model: " + model + "\n"
    + "temperature: " + temperature + "\n"
    + "top_p: " + top_p + "\n"
    + "role_content_system (chat): " + role_content_system + "\n"
    + "max_tokens: " + max_tokens + "\n"
    + "use_vision: " + use_vision + "\n"
    + "use_eval: " + use_eval + "\n"
    + "use_function_calling: " + use_function_calling + "\n"
    + "use_node_ai: " + use_node_ai + "\n"
    + "force_node_ai_query: " + force_node_ai_query + "\n"
    + "use_vector: " + use_vector + "\n"
    + "use_lcation: " + use_location + "\n"
    + "location: " + location + "\n"
    + "role: " + (role || "(not set)") + "\n"
    + "store: " + (store || "(not set)") + "\n");
  }

  // II. Tool calls (function calling) input
  let do_function_calling = false;
  let functionName = "";
  let functionArgsString = "";
  let functionMessage = "";
  let original_input = "";
  if (input.startsWith("!")) {
    do_function_calling = true;
    console.log(chalk.cyanBright("Function calling (query_id = " + queryId + "):"));

    // Function name and arguments
    const function_input = input.split("Q=")[0].substring(1);
    functionName = function_input.split("(")[0];
    functionArgsString = function_input.split("(")[1].split(")")[0];
    console.log("Function input: " + function_input);
    console.log("Function name: " + functionName);
    console.log("Arguments: " + functionArgsString);

    if (functionName === "call_tools") {
      // Execute tool calls
      const tools = tryParseJSON(functionArgsString);
      if (tools) {
        console.log("Tool calls: " + JSON.stringify(tools) + "\n");
      }
    } else {
      // Execute function
      const functionResult = await executeFunction(functionName, functionArgsString);

      // Function trigger event
      if (functionResult.event) {
        const event = JSON.stringify(functionResult.event);
        res.write(`data: ###EVENT###${event}\n\n`);
      }

      // Message
      functionMessage = functionResult.message;
      if (!functionMessage.endsWith("\n")) {
        functionMessage += "\n";
      }
      
      console.log("Result: " + functionMessage.replace(/\n/g, "\\n") + "\n");
      logadd(queryId, model, "F=" + function_input, "F=" + functionMessage, ip, browser);
    }

    // Replace input with original
    original_input = input.split("Q=")[1];
    input = original_input;
  }

  try {
    let token_ct = 0;  // input token count
    let messages = [];

    // Message base
    const generateMessagesResult = await generateMessages(user, input, images, queryId, role, store, use_location, location, 
                                                          do_function_calling, functionName, functionMessage);
    token_ct = generateMessagesResult.token_ct;
    messages = generateMessagesResult.messages;

    // Additional information
    let additionalInfo = "";

    // 3. Node AI response
    if (use_node_ai && force_node_ai_query) {
      console.log("--- node ai query ---");
      const nodeAiQueryResult = await executeFunction("query_node_ai", "{ query: " + input + " }");
      if (nodeAiQueryResult === undefined) {
        console.log("response: undefined.\n");
      } else {
        console.log("response: " + nodeAiQueryResult);
        messages.push({
          "role": "function",
          "name": "query_node_ai",
          "content": "After calling another AI, its response as: " + nodeAiQueryResult,
        });
        logadd(queryId, model, "N=query_node_ai(query=" + input + ")", "N=" + nodeAiQueryResult, ip, browser);
      }
    }

    console.log("--- messages ---");
    console.log(JSON.stringify(messages) + "\n");

    // endpoint: /v1/chat/completions
    const chatCompletion = await openai.chat.completions.create({
      model,
      // response_format: { type: "json_object" },
      messages,
      temperature,
      top_p,
      max_tokens,
      stream: true,
      // vision does not support function calling
      ...(use_function_calling && !use_vision && {
        functions: getFunctions(),
        function_call: "auto",
        // tools: getTools(),
        // tool_choice: "auto"
      })
    });

    res.write(`data: ###ENV###${model}\n\n`);
    res.write(`data: ###STATS###${temperature},${top_p},${token_ct},${use_eval},${functionName}\n\n`);
    res.flush();

    for await (const part of chatCompletion) {
      // handle function call
      if (part.choices[0].delta.function_call) {
        const function_call = part.choices[0].delta.function_call;
        if (function_call) {
          res.write(`data: ###FUNC###${JSON.stringify(function_call)}\n\n`); res.flush();
        }
      }

      // handle tool calls
      if (part.choices[0].delta.tool_calls) {
        const tool_call = part.choices[0].delta.tool_calls[0];
        if (tool_call) {
          res.write(`data: ###TOOL###${JSON.stringify(tool_call)}\n\n`); res.flush();
        }
      }

      // handle message
      const content = part.choices[0].delta.content;
      if (content) {
        output += content;
        let message = content.replaceAll("\n", "###RETURN###");
        res.write(`data: ${message}\n\n`); res.flush();
      }
    }

    // Evaluate result
    // vision models not support evaluation
    if (use_eval) {
      if (output.trim().length > 0) {
        await evaluate(input, additionalInfo, output).then((eval_result) => {
          res.write(`data: ###EVAL###${eval_result}\n\n`); res.flush();
          console.log("eval: " + eval_result + "\n");
        });
      }
    }

    // Done message
    res.write(`data: [DONE]\n\n`); res.flush();

    // Log
    if (output.trim().length === 0) output = "(null)";
    console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
    console.log(output + "\n");
    logadd(queryId, model, input, output, ip, browser);
    
    res.end();
    return;
  } catch (error) {
    console.log("Error:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.write(`data: An error occurred during your request. (${error.response.status})\n\n`)
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.write(`data: An error occurred during your request.\n\n`)
    }
    res.flush();
    res.end();
  }
}
