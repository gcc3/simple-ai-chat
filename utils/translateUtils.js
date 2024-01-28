import OpenAI from "openai";

// OpenAI
const openai = new OpenAI();

// Awesome translator
export async function translate(input, target_language_name) {
  if (!input || input.trim().length === 0) {
    return null;
  }

  let prompt = + "You are an awesome translator. Now you are translating user input to " + target_language_name + ":\n\n"
               + "You'll generate a translation result and response with JSON format below: \n\n"
               + "{" + "\n"
               + "  \"translation\": \"AWESOME_TRANSLATION_RESULT\"" + "\n"
               + "}" + "\n\n"
               + "Remember if user input is already the target language, you should return as below: \n\n"
               + "{" + "\n"
               + "  \"translation\": \"ORIGINAL_USER_INPUT\"" + "\n"
               + "}" + "\n\n"

  let messages = [];
  messages.push({ 
    role: "system",
    content: prompt
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
    return (JSON.parse(result)).translation;
  } catch (error) {
    console.error(error);
    return null;
  }
}