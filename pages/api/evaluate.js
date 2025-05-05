import OpenAI from "openai";
import { countToken } from "utils/tokenUtils.js";
import { getSystemConfigurations } from "utils/systemUtils.js";

// OpenAI
const openai = new OpenAI();

// System configurations
const sysconf = getSystemConfigurations();

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
    console.log("Error (Evaluate API):");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}

export async function evaluate(user, input, raw_prompt, output) {
  // Create evaluation message
  const eval_message = [];

  let eval_prompt = "";
  eval_prompt = "Hi, I'm creating an AI chat application, to enhance the AI's responses I'm using additional information for AI reference." + "\n\n" +
                "Now, the user asks: " + input + "\n\n" +
                "After request additional information, I got additional information in Json format: " + JSON.stringify(raw_prompt) + "\n\n" +
                "After a while, the AI responds with: " + output + "\n\n" +
                "Please evaluate the AI's response for correctness and credibility, 1 being the worst or contains any fake information, 10 being the best, and correct. " +
                "Please only evaluate/consider the correctness, not the information comprehensiveness. " +
                "When you evaluating, notice that sometimes the AI has hallucination answer, the response may looks correct, but actually it is completely fake. " +
                "If the AI response as it doesn't know or doesn't have the information honestly, instead of making fake information or lying, give it a higher score. " +
                "Then, briefly explain why you've given this score in one sentence.\n\n" + 
                "Response in the format: \"score - explaination\"\n" +
                "Example: 7 - Because..."

  eval_message.push({
    role: "user", 
    content: eval_prompt,
  })

  console.log("--- result evaluation --- ");
  console.log("eval_message: " + JSON.stringify(eval_message));

  try {
    let eval_output = "";

    // endpoint: /v1/chat/completions
    const chatCompletion = await openai.chat.completions.create({
      model: sysconf.model,
      messages: eval_message,
      temperature: sysconf.temperature,
      top_p: sysconf.top_p,
    });

    // Get result
    const choices = chatCompletion.choices;
    if (!choices || choices.length === 0) {
      eval_output = "result error";
    } else {
      eval_output = choices[0].message.content;
    }

    // Output the result
    if (eval_output.trim().length === 0) eval_output = "null";
    return {
      success: true,
      token_ct: countToken(sysconf.model, eval_prompt),
      output: eval_output,
    };
  } catch (error) {
    console.log("Error (Evaluate API):");
    return {
      success: false,
      error: JSON.stringify(error),
    };
  }
}
