import OpenAI from "openai";
import { getMaxTokens } from "utils/tokenUtils.js";

// OpenAI
const openai = new OpenAI();

// configurations
const model = process.env.MODEL ? process.env.MODEL : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : getMaxTokens(model);

export default async function (req, res) {
  const input = req.body.input || "";
  const functionResult = req.body.functionResult || "";
  const result_text = req.body.result_text || "";

  try {
    evaluate(input, functionResult, result_text).then((eval_result) => {
      // Output the result
      res.status(200).json({
        result:{
          text : eval_result,
        },
      });
    });
  } catch (error) {
    console.log("Error (evaluate):");
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

export async function evaluate(input, additionalInfo, result_text) {
  // Create evaluation message
  const eval_message = [];

  const additional_info_message = additionalInfo.length == 0 ?
  "There is completely no information found." :
  "The result is: " + additionalInfo;

  eval_message.push({
    role: "user", content: 
    "Hi, I'm creating an AI chat application, to enhance the AI's responses I'm using additional infromation for AI reference." + "\n\n" +
    "Now, the user asks: " + input + "\n\n" +
    "After request additonal information, I got: " + additional_info_message + "\n\n" +
    "After a while, the AI responds with: " + result_text + "\n\n" +
    "Please evaluate the AI's response for correctness and credibility, 1 being the worst or contains any fake information, 10 being the best, and correct. " +
    "Please only evaluate/consider the correctness, not the information comprehensiveness. " +
    "When you evaluating, notice that sometimes the AI has hallucination answer, the response may looks correct, but actually it is completely fake. " +
    "If the AI response as it doesn't know or doesn't have the information honestly, instead of making fake information or lying, give it a higher score. " +
    "Then, briefly explain why you've given this score in one sentence.\n\n" + 
    "Response in the format: \"score - explaination\"\n" +
    "Example: 7 - Because..."
  })

  console.log("--- result evaluation --- ");
  console.log("eval_message: " + JSON.stringify(eval_message));

  try {
    let result_text = "";

    // endpoint: /v1/chat/completions
    const chatCompletion = await openai.chat.completions.create({
      model: model,
      messages: eval_message,
      temperature: temperature,
      top_p: top_p,
      max_tokens: max_tokens,
    });

    // Get result
    const choices = chatCompletion.choices;
    if (!choices || choices.length === 0) {
      result_text = "result error";
    } else {
      result_text = choices[0].message.content;
    }

    // Output the result
    if (result_text.trim().length === 0) result_text = "null";
    return result_text;
  } catch (error) {
    console.log("Error (evaluate):");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
    return "error";
  }
}