import OpenAI from "openai";

// OpenAI
const openai = new OpenAI();

export async function generateMidjourneyPrompt(input) {
  if (!input || input.trim().length === 0) {
    return null;
  }

  let messages = [];
  messages.push({ 
    role: "system",
    content: "You are an awesome Midjourney prompt generator. " 
           + "User provides you, what they desired picture description. You'll add your imagination on it." + "\n"
           + "The description maybe not English, please translate prompt to English." + "\n"
           + "You'll generate a valid Midjourney prompt with parameters (optional) and response with JSON format below: \n\n"
           + "{" + "\n"
           + "  \"prompt\": \"AWESOME_MIDJOURNEY_PROMPT\"" + "\n"
           + "}" + "\n\n"
           + "The prompt must be written before any parameters." + "\n"
           + "Parameters example: \"--ar 2:3 --no sky\" \n\n"
           + "Available parameters: --ar : Change the aspect ratio of a generation.\n"
           + "                      --no : Negative prompting, --no plants would try to remove plants from the image.\n"
           + "                      --chaos <number 0–100> Change how varied the results will be. Higher values produce more unusual and unexpected generations.\n"
           + "                      --iw <0–2> Sets image prompt weight relative to text weight. The default value is 1.\n"
           + "If you know how to use Midjourney, please add your parameters to the prompt. \n"
           + "Remember if user asked a question not related to image generation, you should response an empty query as follows: \n\n"
           + "{" + "\n"
           + "  \"prompt\": \"\"" + "\n"
           + "}" + "\n\n"
  });

  messages.push({
    role: "user",
    content: input,
  });

  try {
    let chatCompletion;
    chatCompletion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      response_format: { type: "json_object" },
      messages: messages,
      temperature: 0.8,
      top_p: 1,
    });

    // Get result
    let result = null;
    const choices = chatCompletion.choices;
    if (choices && choices.length > 0) {
      result = choices[0].message.content;
    }
    return JSON.parse(result);
  } catch (error) {
    console.error(error);
    return null;
  }
}
