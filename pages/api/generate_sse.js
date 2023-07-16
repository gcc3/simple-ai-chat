import { Configuration, OpenAIApi } from "openai";
import chalk from 'chalk';
import { generateMessages } from "./utils/promptUtils";
import { generatePrompt } from "./utils/promptUtils";
import { logfile } from "./utils/logUtils";
import { tryParseJSON } from "./utils/jsonUtils"
import { get_encoding, encoding_for_model } from "tiktoken";
import { evaluate } from './evaluate';
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
const use_eval = process.env.USE_EVAL == "true" ? true : false;
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

  const queryId = req.query.query_id || "";
  const role = req.query.role || "default";
  const use_stats = req.query.use_stats || "false";

  // Input
  let input = decodeURIComponent(req.query.user_input) || "";
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
    + "endpoint: " + process.env.END_POINT + "\n"
    + "fine_tune_prompt_end (text): " + process.env.FINE_TUNE_PROMPT_END + "\n"
    + "fine_tune_stop (text): " + process.env.FINE_TUNE_STOP + "\n"
    + "role_content_system (chat): " + process.env.ROLE_CONTENT_SYSTEM + "\n"
    + "prompt_prefix: " + process.env.PROMPT_PREFIX + "\n"
    + "prompt_suffix: " + process.env.PROMPT_SUFFIX + "\n"
    + "max_tokens: " + process.env.MAX_TOKENS + "\n"
    + "use_eval: " + process.env.USE_EVAL + "\n"
    + "use_function_calling: " + process.env.USE_FUNCTION_CALLING + "\n"
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
    console.log("Result: " + functionResult + "\n");
    logfile("T=" + Date.now() + " S=" + queryId + " F=" + function_input + " A=" + functionResult, req);

    // Replace input with original
    original_input = input.split("Q=")[1];
    input = original_input;
  }

  try {
    let result_text = "";
    let definations = [];
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

    if (process.env.END_POINT === "chat_completion") {
      const generateMessagesResult = await generateMessages(input, queryId, role, tokenizer);
      definations = generateMessagesResult.definations;
      score = generateMessagesResult.score;
      token_ct = generateMessagesResult.token_ct;
      messages = generateMessagesResult.messages;

      if (do_function_calling) {
        // Feed with function calling message
        messages.push({
          "role": "function",
          "name": functionName,
          "content": functionResult,
        });
      }

      // endpoint: /v1/chat/completions
      let chatCompletion;
      if (use_function_calling) {
        chatCompletion = openai.createChatCompletion({
          model: process.env.MODEL,
          messages: messages,
          temperature: temperature,
          top_p: top_p,
          max_tokens: max_tokens,
          stream: true,
          functions: getFunctions(),  // function calling
          function_call: "auto"
        }, { responseType: "stream" });
      } else {
        chatCompletion = openai.createChatCompletion({
          model: process.env.MODEL,
          messages: messages,
          temperature: temperature,
          top_p: top_p,
          max_tokens: max_tokens,
          stream: true,
          function_call: "none"
        }, { responseType: "stream" });
      }

      res.write(`data: ###ENV###${process.env.MODEL}\n\n`);
      res.write(`data: ###STATS###${score},${process.env.TEMPERATURE},${process.env.TOP_P},${token_ct},${process.env.USE_EVAL},${functionName}\n\n`);

      chatCompletion.then(resp => {
        if (stream_console) process.stdout.write(chalk.blueBright("Output (query_id = "+ queryId + "):\n"));

        resp.data.on('data', data => {
          const lines = data.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            const chunkData = line.replace(/^data: /, '');
            
            // handle the DONE signal
            if (chunkData === '[DONE]') {

              // Evaluate result
              if (use_eval && use_stats === "true" && result_text.trim().length > 0) {
                evaluate(input, definations, functionResult, result_text).then((eval_result) => {
                  res.write(`data: ###EVAL###${eval_result}\n\n`);
                  console.log("eval: " + eval_result + "\n");

                  // Done message
                  res.write(`data: [DONE]\n\n`)
                  if (stream_console) {
                    process.stdout.write("\n\n");
                  } else {
                    if (result_text.trim().length === 0) result_text = "(null)";
                    console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
                    console.log(result_text + "\n");
                  }

                  logfile("T=" + Date.now() + " S=" + queryId + " Q=" + input + " A=" + result_text, req);
                  res.flush();
                  res.end();
                  return
                });
                return;
              }

              // Done message
              res.write(`data: [DONE]\n\n`)
              if (stream_console) {
                process.stdout.write("\n\n");
              } else {
                if (result_text.trim().length === 0) result_text = "(null)";
                console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
                console.log(result_text + "\n");
              }
              logfile("T=" + Date.now() + " S=" + queryId + " Q=" + input + " A=" + result_text, req);
              res.flush();
              res.end();
              return
            }

            // convert to JSON
            const jsonChunk = tryParseJSON(chunkData);
            if (jsonChunk === null || !jsonChunk.choices) {
              res.write(`data: ###ERR###\n\n`)
              res.flush();
              res.end();
              return;
            }

            // get the choices
            const choices = jsonChunk.choices;
            if (!choices || choices.length === 0) {
              console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
              console.error("No choices\n");
              res.write(`data: (Silent...)\n\n`)
              res.flush();
              res.end();
              return;
            }

            // handle function calling
            const function_call = choices[0].delta.function_call;
            if (function_call) {
              res.write(`data: ###FUNC###${JSON.stringify(function_call)}\n\n`)
            }
            
            // handle the message
            const content = choices[0].delta.content;
            if (content) {
              let message = "";
              message = content.replaceAll("\n", "###RETURN###");
              if (stream_console) process.stdout.write(content); else result_text += content;
              res.write(`data: ${message}\n\n`)
            }
            res.flush();
          }
        });
      }).catch(error => {
        console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
        console.error(error.message + "\n");
        console.log("--- query detail ---");
        console.log("message: " + JSON.stringify(messages) + "\n");
        res.write(`data: [ERR] ${error}\n\n`)
        res.end();
      });
    }

    if (process.env.END_POINT === "text_completion") {
      const prompt = generatePrompt(input);

      // endpoint: /v1/completions
      const completion = openai.createCompletion({
        model: process.env.MODEL,
        prompt: prompt,
        temperature: temperature,
        top_p: top_p,
        stop: fine_tune_stop,
        max_tokens: max_tokens,
        stream: true,
      }, { responseType: "stream" });

      res.write(`data: ###ENV###${process.env.MODEL}\n\n`);
      res.write(`data: ###STATS###${score},${process.env.TEMPERATURE},${process.env.TOP_P},${token_ct}\n\n`);

      completion.then(resp => {
        if (stream_console) process.stdout.write(chalk.blueBright("Output (query_id = "+ queryId + "):\n"));

        resp.data.on('data', data => {
          const lines = data.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            const chunkData = line.replace(/^data: /, '');

            // handle the DONE signal
            if (chunkData === '[DONE]') {
              res.write(`data: [DONE]\n\n`)
              if (stream_console) {
                process.stdout.write("\n\n");
              } else {
                if (result_text.trim().length === 0) result_text = "(null)";
                console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
                console.log(result_text + "\n");
              }
              logfile("T=" + Date.now() + " S=" + queryId + " Q=" + input + " A=" + result_text, req);
              res.flush();
              res.end();
              return
            }

            // handle the message
            const jsonChunk = tryParseJSON(chunkData);
            if (jsonChunk === null || !jsonChunk.choices) {
              res.write(`data: ###ERR###\n\n`)
              res.flush();
              res.end();
              return;
            }

            const choices = jsonChunk.choices;
            if (!choices || choices.length === 0) {
              console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
              console.error("No choice\n");
              res.write(`data: Silent...\n\n`)
              res.flush();
              res.end();
              return;
            }
            const text = choices[0].text;
            if (text) {
              let message = "";
              message = text.replaceAll("\n", "###RETURN###");
              if (stream_console) process.stdout.write(text); else result_text += text;
              res.write(`data: ${message}\n\n`)
            }
            res.flush();
          }
        });
      }).catch(error => {
        console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
        console.error(error.message);
        console.log("--- query detail ---");
        console.log("prompt: " +JSON.stringify(prompt) + "\n");
        res.write(`data: [ERR] ${error}\n\n`)
        res.end();
      });
    }
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
