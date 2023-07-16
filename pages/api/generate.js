import { Configuration, OpenAIApi } from "openai";
import chalk from 'chalk';
import { generateMessages } from "./utils/promptUtils";
import { generatePrompt } from "./utils/promptUtils";
import { logfile } from "./utils/logUtils.js";
import { get_encoding, encoding_for_model } from "tiktoken";
import { getFunctions, executeFunction } from "./utils/functionUtils";

// OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const tokenizer = encoding_for_model(process.env.MODEL);

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const fine_tune_stop = process.env.FINE_TUNE_STOP ? process.env.FINE_TUNE_STOP : "";
const fine_tune_prompt_end = process.env.FINE_TUNE_PROMPT_END ? process.env.FINE_TUNE_PROMPT_END : "";
const prompt_prefix = process.env.PROMPT_PREFIX ? process.env.PROMPT_PREFIX : "";
const prompt_suffix = process.env.PROMPT_SUFFIX ? process.env.PROMPT_SUFFIX : "";
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : 500;
const stream_console = process.env.STREAM_CONSOLE == "true" ? true : false;
const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
      },
    });
    return;
  }

  const queryId = req.body.query_id || "";
  const role = req.body.role || "";

  // Input
  let input = req.body.user_input || "";
  if (input.trim().length === 0) return;
  input = prompt_prefix + input + prompt_suffix;
  console.log(chalk.yellowBright("\nInput (query_id = " + queryId + "):"));
  console.log(input + "\n");

  // Configuration info
  console.log("--- configuration info ---\n" 
  + "model: " + process.env.MODEL + "\n"
  + "temperature: " + process.env.TEMPERATURE + "\n"
  + "top_p: " + process.env.TOP_P + "\n"
  + "endpoint: " + process.env.END_POINT + "\n"
  + "fine_tune_prompt_end (text): " + process.env.FINE_TUNE_PROMPT_END + "\n"
  + "fine_tune_stop (text): " + process.env.FINE_TUNE_STOP + "\n"
  + "role_content_system (chat): " + process.env.ROLE_CONTENT_SYSTEM + "\n"
  + "prompt_prefix: " + process.env.PROMPT_PREFIX + "\n"
  + "prompt_suffix: " + process.env.PROMPT_SUFFIX + "\n"
  + "max_tokens: " + process.env.MAX_TOKENS + "\n"
  + "use_function_calling: " + process.env.USE_FUNCTION_CALLING + "\n"
  + "role: " + role + "\n");

  try {
    let result_text = "";
    let score = 0;
    let token_ct = 0;
    let do_function_calling = false;
    let function_name = "";

    if (process.env.END_POINT === "chat_completion") {
      const generateMessagesResult = await generateMessages(input, queryId, role, tokenizer);
      score = generateMessagesResult.score;
      token_ct = generateMessagesResult.token_ct;

      // endpoint: /v1/chat/completions
      let chatCompletion;
      if (use_function_calling) {
        chatCompletion = await openai.createChatCompletion({
          model: process.env.MODEL,
          messages: generateMessagesResult.messages,
          temperature: temperature,
          top_p: top_p,
          max_tokens: max_tokens,
          functions: getFunctions(),  // function calling
          function_call: "auto"
        });
      } else {
        chatCompletion = await openai.createChatCompletion({
          model: process.env.MODEL,
          messages: generateMessagesResult.messages,
          temperature: temperature,
          top_p: top_p,
          max_tokens: max_tokens,
          function_call: "none"
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
          console.log("Result: " + functionResult);
  
          // Functions messages
          // Include original messages
          let functionMessages = generateMessagesResult.messages;
          functionMessages.push(responseFunctionMessage);
          functionMessages.push({
            "role": "function",
            "name": functionName,
            "content": functionResult,
          });
  
          const functionChatCompletion = await openai.createChatCompletion({
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
            const functionResult = functionChatCompletion.data.choices[0].message.content;
            result_text = functionResult;
          }
        }
      }
    }

    if (process.env.END_POINT === "text_completion") {
      const prompt = generatePrompt(input);

      // endpoint: /v1/completions
      const completion = await openai.createCompletion({
        model: process.env.MODEL,
        prompt: prompt,
        temperature: temperature,
        top_p: top_p,
        stop: fine_tune_stop,
        max_tokens: max_tokens,
      });

      // Get result
      const choices = completion.data.choices;
      if (!choices || choices.length === 0) {
        console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
        console.error("No choice\n");
        result_text = "Silent...";
      } else {
        result_text = choices[0].text;
      }
    }

    // Output the result
    if (result_text.trim().length === 0) result_text = "(null)";
    console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
    console.log(result_text + "\n");
    logfile("T=" + Date.now() + " S=" + queryId + " Q=" + input + " A=" + result_text, req);
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
