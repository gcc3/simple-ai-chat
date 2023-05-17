import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
      },
    });
    return;
  }

  const chatInput = req.body.aiChat || "";
  if (chatInput.trim().length === 0) {
    return;
  }

  try {
    let result = "null";
    if (process.env.MODEL === "gpt-3.5-turbo") {
      // endpoint: /v1/chat/completions
      const chatCompletion = await openai.createChatCompletion({
        model: process.env.MODEL,
        messages: [
          {
            role: "user",
            content: chatInput,
          },
        ],
        temperature: 0,
      });
      result = chatCompletion.data.choices[0].message.content;
    }

    if (process.env.MODEL === "text-davinci-003") {
      // endpoint: /v1/completions
      const completion = await openai.createCompletion({
        model: process.env.MODEL,
        prompt: generatePrompt(chatInput),
        temperature: 0,
      });
      result = completion.data.choices[0].text;
    }

    // Output the result
    console.log("Output:" + result + "\n");
    res.status(200).json({
      result: result,
    });
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
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

function generatePrompt(chatInput) {
  // TODO add prompt here
  console.log("Input: " + chatInput);
  return chatInput;
}
