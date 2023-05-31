import { Configuration, OpenAIApi } from "openai";
import chalk from 'chalk';
import { generateMessages } from "./utils/promptUtils";
import { generatePrompt } from "./utils/promptUtils";
import { logfile } from "./utils/logUtils.js";

// OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
      },
    });
    return;
  }

  const query_id = req.body.query_id || "";

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
  + "max_tokens: " + process.env.MAX_TOKENS + "\n");

  // Input
  let input = req.body.user_input || "";
  if (input.trim().length === 0) return;
  input = prompt_prefix + input + prompt_suffix;
  console.log(chalk.yellowBright("Input (query_id = " + query_id + "):"));
  console.log(input + "\n");

  try {
    let result_text = "";
    let score = 0;

    if (process.env.END_POINT === "chat_completion") {
      const generateMessagesResult = await generateMessages(input);
      score = generateMessagesResult.score;

      // endpoint: /v1/chat/completions
      const chatCompletion = await openai.createChatCompletion({
        model: process.env.MODEL,
        messages: generateMessagesResult.messages,
        temperature: temperature,
        top_p: top_p,
        max_tokens: max_tokens,
      });

      // Get result
      const choices = chatCompletion.data.choices;
      if (!choices || choices.length === 0) {
        console.log(chalk.redBright("Error (query_id = " + query_id + "):"));
        console.error("No choice\n");
        result_text = "(Silent...)";
      } else {
        result_text = choices[0].message.content;
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
        console.log(chalk.redBright("Error (query_id = " + query_id + "):"));
        console.error("No choice\n");
        result_text = "(Silent...)";
      } else {
        result_text = choices[0].text;
      }
    }

    // Output the result
    if (result_text.trim().length === 0) result_text = "(null)";
    console.log(chalk.blueBright("Output (query_id = "+ query_id + "):"));
    console.log(result_text + "\n");
    logfile("T=" + Date.now() + " S=" + query_id + " Q=" + input + " A=" + result_text, req);
    res.status(200).json({
      result: {
        text : result_text,
        stats: {
          temperature: process.env.TEMPERATURE,
          top_p: process.env.TOP_P,
          score: score,
        },
        info: {
          model: process.env.MODEL,
        }
      },
    });
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
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
