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
           + "You'll generate a valid Midjourney prompt and response with JSON format below: \n\n"
           + "{" + "\n"
           + "  \"prompt\": \"AWESOME_MIDJOURNEY_PROMPT\"" + "\n"
           + "  \"parameters\": \"INVALID_MIDJOURNEY_PARAMETERS\"" + "\n"
           + "}" + "\n\n"
           + "Remember if user asked a question not related to image generation, you should response an empty query as follows: \n\n"
           + "{" + "\n"
           + "  \"prompt\": \"\"" + "\n"
           + "  \"parameters\": \"\"" + "\n"
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
