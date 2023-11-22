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
import { countChatsForIP, countChatsForUser } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";

// OpenAI
const openai = new OpenAI();

// configurations
const model = process.env.MODEL ? process.env.MODEL : "";
const model_v = process.env.MODEL_V ? process.env.MODEL_V : "";
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const prompt_prefix = process.env.PROMPT_PREFIX ? process.env.PROMPT_PREFIX : "";
const prompt_suffix = process.env.PROMPT_SUFFIX ? process.env.PROMPT_SUFFIX : "";
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : getMaxTokens(model);
const dict_search = process.env.DICT_SEARCH == "true" ? true : false;
const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;
const use_node_ai = process.env.USE_NODE_AI == "true" ? true : false;
const force_node_ai_query = process.env.FORCE_NODE_AI_QUERY == "true" ? true : false;
const use_vector = process.env.USE_VECTOR == "true" ? true : false;
const force_vector_query = process.env.FORCE_VECTOR_QUERY == "true" ? true : false;

export default async function (req, res) {
  const queryId = req.query.query_id || "";
  const role = req.query.role || "default";
  const use_stats = req.query.use_stats === "true" ? true : false;
  const use_location = req.query.use_location === "true" ? true : false;
  const location = req.query.location || "";
  const images_ = req.query.images || "";
  const files_ = req.query.files || "";

  res.writeHead(200, {
    'connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',  // disables proxy buffering for NGINX
                                // IMPORTANT! without this the stream not working on remote server
  });

  // Verfiy user access
  // Authentication
  const authResult = authenticate(req);
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (!authResult.success) {
    // Not a user
    const chatCount = await countChatsForIP(ip, Date.now() - 86400000, Date.now());  // daily usage
    if (chatCount > 10) {
      res.write(`data: Usage exceeded. Please log in to continue. To register a user, use the command \`:user add [username] [email?]\`.\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }
  } else {
    // User
    const user = authResult.user;
    if (!user.email) {
      const chatCount = await countChatsForUser(user.username, Date.now() - 86400000, Date.now());  // daily usage
      if (chatCount > 10) {
        res.write(`data: Email verification is required, please add a email address to continue. To add email address, use the command \`:user set email [email]\`.\n\n`); res.flush();
        res.write(`data: [DONE]\n\n`); res.flush();
        res.end();
        return;
      }
    } else {
      // Pro user
      const chatCount = await countChatsForUser(user.username, Date.now() - 86400000, Date.now());  // daily usage
      if (chatCount > 30) {
        res.write(`data: Usage exceeded. Please upgrade your account to continue. To upgrade your account, please contact support@simple-io.\n\n`); res.flush();
        res.write(`data: [DONE]\n\n`); res.flush();
        res.end();
        return;
      }
    }
  }
  
  // Query ID, same as session ID
  const verifyResult = verifySessionId(queryId);
  if (!verifyResult.success) {
    res.write(`data: ${verifyResult.message}\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Input
  let user_input_escape = req.query.user_input.replaceAll("%", "％").trim();  // escape %
  let input = decodeURIComponent(user_input_escape) || "";
  if (input.trim().length === 0) return;
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
  const model_switch = use_vision ? model_v : model;
  const use_eval = use_stats && !use_vision;

  // I. Normal input
  if (!input.startsWith("!")) {
    input = prompt_prefix + input + prompt_suffix;
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
    + "model: " + model_switch + "\n"
    + "temperature: " + temperature + "\n"
    + "top_p: " + top_p + "\n"
    + "role_content_system (chat): " + role_content_system + "\n"
    + "prompt_prefix: " + prompt_prefix + "\n"
    + "prompt_suffix: " + prompt_suffix + "\n"
    + "max_tokens: " + max_tokens + "\n"
    + "dict_search: " + dict_search + "\n"
    + "use_vision: " + use_vision + "\n"
    + "use_eval: " + use_eval + "\n"
    + "use_function_calling: " + use_function_calling + "\n"
    + "use_node_ai: " + use_node_ai + "\n"
    + "force_node_ai_query: " + force_node_ai_query + "\n"
    + "use_vector: " + use_vector + "\n"
    + "force_vector_query: " + force_vector_query + "\n"
    + "use_lcation: " + use_location + "\n"
    + "location: " + location + "\n"
    + "role: " + role + "\n");
  }

  // II. Tool calls (function calling) input
  let do_function_tool_calls = false;
  let functionName = "";
  let functionArgsString = "";
  let functionResult = "";
  let original_input = "";
  if (input.startsWith("!")) {
    do_function_tool_calls = true;
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
      functionResult = await executeFunction(functionName, functionArgsString);
      if (!functionResult.endsWith("\n")) {
        functionResult += "\n";
      }
      console.log("Result: " + functionResult.replace(/\n/g, "\\n") + "\n");
      logadd(queryId, "F=" + function_input + " A=" + functionResult, req);
    }

    // Replace input with original
    original_input = input.split("Q=")[1];
    input = original_input;
  }

  try {
    let result_text = "";
    let definitions = [];
    let score = 0;
    let token_ct = 0;
    let messages = [];

    // Message base
    const generateMessagesResult = await generateMessages(input, images, queryId, role);
    definitions = generateMessagesResult.definitions;
    score = generateMessagesResult.score;
    token_ct = generateMessagesResult.token_ct;
    messages = generateMessagesResult.messages;

    // Additional information
    let additionalInfo = "";

    // 1. Location info
    if (use_location && location) {
      // localtion example: (40.7128, -74.0060)
      const lat = location.slice(1, -1).split(",")[0];
      const lng = location.slice(1, -1).split(",")[1];
      const nearbyCities = require("nearby-cities")
      const query = {latitude: lat, longitude: lng}
      const cities = nearbyCities(query)
      const city = cities[0]
      const locationMessage = "User is currently near city " + city.name + ", " + city.country + ".";

      // Feed with location message
      messages.push({
        "role": "system",
        "content": locationMessage
      });
      additionalInfo += locationMessage;
    }

    // 2. Function calling result
    if (do_function_tool_calls) {
      // Feed message with function calling result
      messages.push({
        "role": "function",
        "name": functionName,
        "content": functionResult,
      });
      additionalInfo += functionResult;
    }

    // 3. Node AI response
    if (use_node_ai && force_node_ai_query) {
      console.log("--- node ai query ---");
      // Feed message with AI node query result
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
        additionalInfo += nodeAiQueryResult;
        logadd(queryId, "F(f)=query_node_ai(query=" + input + ") A=" + nodeAiQueryResult, req);
      }
    }

    // 4. Vector database query result
    let refer_doc = "none";
    if (use_vector && force_vector_query) {
      console.log("--- vector query ---");
      // Feed message with AI node query result
      const vectorQueryResult = await executeFunction("query_vector", "{ query: " + input + " }");
      if (vectorQueryResult === undefined) {
        console.log("response: undefined.\n");
      } else {
        console.log("response: " + vectorQueryResult.replaceAll("\n", "\\n") + "\n");
        messages.push({
          "role": "function",
          "name": "query_vector",
          "content": "Retrieved context: " + vectorQueryResult,
        });
        additionalInfo += vectorQueryResult;
        logadd(queryId, "F(f)=query_vector(query=" + input + ") A=" + vectorQueryResult, req);

        // Get vector score and refer doc info
        if (vectorQueryResult.includes("###VECTOR###")) {
          const vector_stats = vectorQueryResult.substring(vectorQueryResult.indexOf("###VECTOR###") + 12).trim();
          refer_doc = vector_stats;
        }
      }
    }

    console.log("--- messages ---");
    console.log(JSON.stringify(messages) + "\n");

    // endpoint: /v1/chat/completions
    const chatCompletion = await openai.chat.completions.create({
      model: model_switch,
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

    res.write(`data: ###ENV###${model_switch}\n\n`);
    res.write(`data: ###STATS###${score},${temperature},${top_p},${token_ct},${use_eval},${functionName},${refer_doc}\n\n`);
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
        result_text += content;
        let message = content.replaceAll("\n", "###RETURN###");
        res.write(`data: ${message}\n\n`); res.flush();
      }
    }

    // Evaluate result
    // vision models not support evaluation
    if (use_eval) {
      if (result_text.trim().length > 0) {
        await evaluate(input, definitions, additionalInfo, result_text).then((eval_result) => {
          res.write(`data: ###EVAL###${eval_result}\n\n`); res.flush();
          console.log("eval: " + eval_result + "\n");
        });
      }
    }

    // Done message
    res.write(`data: [DONE]\n\n`); res.flush();

    // Log
    if (result_text.trim().length === 0) result_text = "(null)";
    console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
    console.log(result_text + "\n");
    logadd(queryId, "Q=" + input + " A=" + result_text, req);

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
