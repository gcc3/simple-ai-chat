import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils";
import { tryParseJSON } from "utils/jsonUtils"
import { get_encoding, encoding_for_model } from "tiktoken";
import { evaluate } from './evaluate';
import { getFunctions, executeFunction } from "function.js";

// OpenAI
const openai = new OpenAI();
const tokenizer = encoding_for_model(process.env.MODEL);

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const prompt_prefix = process.env.PROMPT_PREFIX ? process.env.PROMPT_PREFIX : "";
const prompt_suffix = process.env.PROMPT_SUFFIX ? process.env.PROMPT_SUFFIX : "";
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : 500;
const use_eval = process.env.USE_EVAL == "true" ? true : false;
const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;
const use_node_ai = process.env.USE_NODE_AI == "true" ? true : false;
const force_node_ai_query = process.env.FORCE_NODE_AI_QUERY == "true" ? true : false;
const use_vector = process.env.USE_VECTOR == "true" ? true : false;
const force_vector_query = process.env.FORCE_VECTOR_QUERY == "true" ? true : false;

export default async function (req, res) {
  const queryId = req.query.query_id || "";
  const role = req.query.role || "default";
  const use_stats = req.query.use_stats || "false";
  const use_location = req.query.use_location || "false";
  const location = req.query.location || "";

  // Input
  let user_input_escape = req.query.user_input.replaceAll("%", "％").trim();  // escape %
  let input = decodeURIComponent(user_input_escape) || "";
  if (input.trim().length === 0) return;

  // Normal input
  if (!input.startsWith("!")) {
    input = prompt_prefix + input + prompt_suffix;
    console.log(chalk.yellowBright("Input (query_id = " + queryId + "):"));
    console.log(input + "\n");

    // Configuration info
    console.log("--- configuration info ---\n" 
    + "model: " + process.env.MODEL + "\n"
    + "temperature: " + process.env.TEMPERATURE + "\n"
    + "top_p: " + process.env.TOP_P + "\n"
    + "role_content_system (chat): " + process.env.ROLE_CONTENT_SYSTEM + "\n"
    + "prompt_prefix: " + process.env.PROMPT_PREFIX + "\n"
    + "prompt_suffix: " + process.env.PROMPT_SUFFIX + "\n"
    + "max_tokens: " + process.env.MAX_TOKENS + "\n"
    + "dict_search: " + process.env.DICT_SEARCH + "\n"
    + "use_eval: " + process.env.USE_EVAL + "\n"
    + "use_function_calling: " + process.env.USE_FUNCTION_CALLING + "\n"
    + "use_node_ai: " + process.env.USE_NODE_AI + "\n"
    + "force_node_ai_query: " + process.env.FORCE_NODE_AI_QUERY + "\n"
    + "use_vector: " + process.env.USE_VECTOR + "\n"
    + "force_vector_query: " + process.env.FORCE_VECTOR_QUERY + "\n"
    + "use_lcation: " + use_location + "\n"
    + "location: " + location + "\n"
    + "role: " + role + "\n");
  }

  // Function calling input
  let do_function_calling = false;
  let functionName = "";
  let functionArgs = "";
  let functionResult = "";
  let original_input = "";
  if (input.startsWith("!")) {
    do_function_calling = true;
    console.log(chalk.cyanBright("Function calling (query_id = " + queryId + "):"));

    // Function name and arguments
    const function_input = input.split("Q=")[0].substring(1);
    functionName = function_input.split("(")[0];
    functionArgs = function_input.split("(")[1].split(")")[0];
    console.log("Function name: " + functionName);
    console.log("Arguments: " + functionArgs);

    // Execute function
    functionResult = await executeFunction(functionName, functionArgs);
    if (!functionResult.endsWith("\n")) {
      functionResult += "\n";
    }
    console.log("Result: " + functionResult.replace(/\n/g, "\\n") + "\n");
    logadd("T=" + Date.now() + " S=" + queryId + " F=" + function_input + " A=" + functionResult, req);

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

    res.writeHead(200, {
      'connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',  // disables proxy buffering for NGINX
                                  // IMPORTANT! without this the stream not working on remote server
    });

    // Message base
    const generateMessagesResult = await generateMessages(input, queryId, role, tokenizer);
    definitions = generateMessagesResult.definitions;
    score = generateMessagesResult.score;
    token_ct = generateMessagesResult.token_ct;
    messages = generateMessagesResult.messages;

    // Additional information
    let additionalInfo = "";

    // 1. Location info
    if (use_location === "true" && location) {
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
    if (do_function_calling) {
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
      const nodeAiQueryResult = await executeFunction("query_node_ai", "query=" + input);
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
        logadd("T=" + Date.now() + " S=" + queryId + " F(f)=query_node_ai(query=" + input + ") A=" + nodeAiQueryResult, req);
      }
    }

    // 4. Vector database query result
    let refer_doc = "none";
    if (use_vector && force_vector_query) {
      console.log("--- vector query ---");
      // Feed message with AI node query result
      const vectorQueryResult = await executeFunction("query_vector", "query=" + input);
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
        logadd("T=" + Date.now() + " S=" + queryId + " F(f)=query_vector(query=" + input + ") A=" + vectorQueryResult, req);

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
      model: process.env.MODEL,
      messages,
      temperature,
      top_p,
      max_tokens,
      stream: true,
      ...(use_function_calling && {
        functions: getFunctions(),
        function_call: "auto"
      })
    });

    res.write(`data: ###ENV###${process.env.MODEL}\n\n`);
    res.write(`data: ###STATS###${score},${process.env.TEMPERATURE},${process.env.TOP_P},${token_ct},${process.env.USE_EVAL},${functionName},${refer_doc}\n\n`);
    res.flush();

    for await (const part of chatCompletion) {
      // handle function calling
      const function_call = part.choices[0].delta.function_call;
      if (function_call) {
        res.write(`data: ###FUNC###${JSON.stringify(function_call)}\n\n`);
        res.flush();
      }

      // handle message
      const content = part.choices[0].delta.content;
      if (content) {
        result_text += content;
        let message = content.replaceAll("\n", "###RETURN###");
        res.write(`data: ${message}\n\n`);
        res.flush();
      }
    }

    // Evaluate result
    if (use_eval && use_stats === "true" && result_text.trim().length > 0) {
      await evaluate(input, definitions, additionalInfo, result_text).then((eval_result) => {
        res.write(`data: ###EVAL###${eval_result}\n\n`);
        res.flush();
        console.log("eval: " + eval_result + "\n");
      });
    }

    // Done message
    res.write(`data: [DONE]\n\n`)
    res.flush();

    // Log
    if (result_text.trim().length === 0) result_text = "(null)";
    console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
    console.log(result_text + "\n");
    logadd("T=" + Date.now() + " S=" + queryId + " Q=" + input + " A=" + result_text, req);

    res.end();
    return
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
