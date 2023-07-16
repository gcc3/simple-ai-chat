import { Configuration, OpenAIApi } from "openai";
import chalk from 'chalk';
import { generateMessages } from "./utils/promptUtils";
import { generatePrompt } from "./utils/promptUtils";
import { logfile } from "./utils/logUtils.js";
import { get_encoding, encoding_for_model } from "tiktoken";

// OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const tokenizer = encoding_for_model(process.env.MODEL);  // TODO, check token

// configurations
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : 500;

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
      },
    });
    return;
  }

  const input = req.body.input || "";
  const definations = req.body.definations || "";
  const functionResult = req.body.functionResult || "";
  const result_text = req.body.result_text || "";

  try {
    evaluate(input, definations, functionResult, result_text).then((eval_result) => {
      // Output the result
      res.status(200).json({
        result:{
          text : eval_result,
        },
      });
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

export async function evaluate(input, definations, functionResult, result_text) {
  if (!configuration.apiKey) {
    return "error";
  }

  // Create evaluation message
  const eval_message = [];
  const dictionary_message = definations.length == 0 ? 
    "There is completely no information found." : 
    "The dictionary search result in JSON format is: " + JSON.stringify(definations);
  const function_message = functionResult.length == 0 ?
    "There is completely no information found." :
    "The API search result in JSON format is: " + functionResult;

  eval_message.push({
    role: "user", content: 
    "Hi, I'm creating an AI chat application, to enhance the AI's responses I'm using a dictionary and API to get information for the AI to reference." + "\n\n" +
    "Now, the user asks: " + input + "\n\n" +
    "After searching the dictionary. " + dictionary_message + "\n\n" +
    "After request more information with API." + function_message + "\n\n" +
    "After a while, the AI responds with: " + result_text + "\n\n" +
    "Please evaluate the AI's response for correctness and credibility, 1 being the worst or contains any fake information, 10 being the best, and correct. " +
    "Please only evaluate/consider the correctness, not the information comprehensiveness. " +
    "When you evaluating, notice that sometimes the AI has hallucination answer, the response may looks correct, but as no exactly match in dictionary the response is completely fake. " +
    "If the AI response as it doesn't know or doesn't have the information honestly, instead of making fake information or lying, give it a higher score. " +
    "Then, briefly explain why you've given this score in one sentence.\n\n" + 
    "Response in the format: \"score - explaination\"\n" +
    "Example: 7 - Because..."
  })

  console.log("--- result evaluation --- ");
  console.log("eval_message: " + JSON.stringify(eval_message));

  try {
    let result_text = "";

    if (process.env.END_POINT === "chat_completion") {
      // endpoint: /v1/chat/completions
      const chatCompletion = await openai.createChatCompletion({
        model: process.env.MODEL,
        messages: eval_message,
        temperature: temperature,
        top_p: top_p,
        max_tokens: max_tokens,
      });

      // Get result
      const choices = chatCompletion.data.choices;
      if (!choices || choices.length === 0) {
        result_text = "result error";
      } else {
        result_text = choices[0].message.content;
      }
    }

    if (process.env.END_POINT === "text_completion") {
      return "model unsupported"
    }

    // Output the result
    if (result_text.trim().length === 0) result_text = "null";
    return result_text;
  } catch (error) {
    console.log("Error:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
    return "error";
  }
}