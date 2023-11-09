import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils.js";
import { getFunctions, executeFunction } from "function.js";
import { getMaxTokens } from "utils/tokenUtils";

// OpenAI
const openai = new OpenAI();

// configurations
const model = process.env.MODEL ? process.env.MODEL : "";
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const prompt_prefix = process.env.PROMPT_PREFIX ? process.env.PROMPT_PREFIX : "";
const prompt_suffix = process.env.PROMPT_SUFFIX ? process.env.PROMPT_SUFFIX : "";
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : getMaxTokens(model);
const dict_search = process.env.DICT_SEARCH == "true" ? true : false;
const use_eval = process.env.USE_EVAL == "true" ? true : false;
const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;
const use_node_ai = process.env.USE_NODE_AI == "true" ? true : false;
const force_node_ai_query = process.env.FORCE_NODE_AI_QUERY == "true" ? true : false;
const use_vector = process.env.USE_VECTOR == "true" ? true : false;
const force_vector_query = process.env.FORCE_VECTOR_QUERY == "true" ? true : false;

export default async function (req, res) {
  const queryId = req.body.query_id || "";
  const role = req.body.role || "";
  const use_stats = req.body.use_stats || false;
  const use_location = req.body.use_location || false;
  const location = req.body.location || "";

  // Input
  let input = req.body.user_input || "";
  if (input.trim().length === 0) return;
  input = prompt_prefix + input + prompt_suffix;
  console.log(chalk.yellowBright("\nInput (query_id = " + queryId + "):"));
  console.log(input + "\n");

  // Configuration info
  console.log("--- configuration info ---\n" 
  + "model: " + model + "\n"
  + "temperature: " + temperature + "\n"
  + "top_p: " + top_p + "\n"
  + "role_content_system (chat): " + role_content_system + "\n"
  + "prompt_prefix: " + prompt_prefix + "\n"
  + "prompt_suffix: " + prompt_suffix + "\n"
  + "max_tokens: " + max_tokens + "\n"
  + "dict_search: " + dict_search + "\n"
  + "use_eval: " + use_eval + "\n"
  + "use_function_calling: " + use_function_calling + "\n"
  + "use_node_ai: " + use_node_ai + "\n"
  + "force_node_ai_query: " + force_node_ai_query + "\n"
  + "use_vector: " + use_vector + "\n"
  + "force_vector_query: " + force_vector_query + "\n"
  + "use_lcation: " + use_location + "\n"
  + "location: " + location + "\n"
  + "role: " + role + "\n");

  try {
    let result_text = "";
    let score = 0;
    let token_ct = 0;
    let do_function_calling = false;
    let function_name = "";

    const generateMessagesResult = await generateMessages(input, null, queryId, role);  // image_url not supported yet
    score = generateMessagesResult.score;
    token_ct = generateMessagesResult.token_ct;

    // endpoint: /v1/chat/completions
    let chatCompletion;
    if (use_function_calling) {
      chatCompletion = await openai.chat.completions.create({
        model: process.env.MODEL,
        messages: generateMessagesResult.messages,
        temperature: temperature,
        top_p: top_p,
        max_tokens: max_tokens,
        functions: getFunctions(),  // function calling
        function_call: "auto"
      });
    } else {
      chatCompletion = await openai.chat.completions.create({
        model: process.env.MODEL,
        messages: generateMessagesResult.messages,
        temperature: temperature,
        top_p: top_p,
        max_tokens: max_tokens,
      });
    }

    // Get result
    const choices = chatCompletion.data.choices;
    if (!choices || choices.length === 0) {
      console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
      console.error("No choice\n");
      result_text = "Silent...";
    } else {
      result_text = choices[0].message.content;

      // Function call
      if (use_function_calling && choices[0].message.function_call) {
        console.log(chalk.cyanBright("Function calling (query_id = " + queryId + "):"));
        do_function_calling = true;
        const responseFunctionMessage = choices[0].message;

        // Function name
        const functionName = responseFunctionMessage.function_call.name;
        function_name = functionName;
        console.log("Function name: " + functionName);
        
        // Arguments
        const args = JSON.parse(responseFunctionMessage.function_call.arguments);
        let argsStrings = [];
        for (const [key, value] of Object.entries(args)) {
          console.log(key, value);
          argsStrings.push(key + "=" + value);
        }
        const argsString = argsStrings.join(", ");
        console.log("Arguments: " + argsString);

        // Execute function
        const functionResult = await executeFunction(functionName, argsString);
        console.log("Result: " + functionResult.replace(/\n/g, "\\n") + "\n");

        // Functions messages
        // Include original messages
        let functionMessages = generateMessagesResult.messages;
        functionMessages.push(responseFunctionMessage);
        functionMessages.push({
          "role": "function",
          "name": functionName,
          "content": functionResult,
        });

        const functionChatCompletion = await openai.chat.completions.create({
            model: process.env.MODEL,
            messages: functionMessages,
            temperature: temperature,
            top_p: top_p,
            max_tokens: max_tokens,
        });

        if (!choices || choices.length === 0) {
          console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
          console.error("No choice\n");
          result_text = "Silent...";
        } else {
          const functionResult = functionChatCompletion.choices[0].message.content;
          result_text = functionResult;
        }
      }
    }

    // Output the result
    if (result_text.trim().length === 0) result_text = "(null)";
    console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
    console.log(result_text + "\n");
    logadd(queryId, "Q=" + input + " A=" + result_text, req);

    res.status(200).json({
      result: {
        text : result_text,
        stats: {
          temperature: process.env.TEMPERATURE,
          top_p: process.env.TOP_P,
          score: score,
          token_ct: token_ct,
          func: do_function_calling && function_name
        },
        info: {
          model: process.env.MODEL,
        }
      },
    });
  } catch (error) {
    console.log("Error:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}
