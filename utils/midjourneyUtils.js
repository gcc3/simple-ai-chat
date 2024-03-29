import OpenAI from "openai";

// OpenAI
const openai = new OpenAI();

export async function generateMidjourneyPrompt(input, lastMjPrompt) {
  if (!input || input.trim().length === 0) {
    return null;
  }

  if (lastMjPrompt && lastMjPrompt.trim().length > 0) {
    input = "Last time you generated prompt: " + lastMjPrompt + "\n" 
          + "I want you modify it to fit my new requirement: " + input;
  }

  // Add prompt awesome
  let prompt_awesome = "I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide detailed and creative descriptions that will inspire unique and interesting images from the AI. Keep in mind that the AI is capable of understanding a wide range of language and can interpret abstract concepts, so feel free to be as imaginative and descriptive as possible. For example, you could describe a scene from a futuristic city, or a surreal landscape filled with strange creatures. The more detailed and imaginative your description, the more interesting the resulting image will be. Here is your first prompt: \"A field of wildflowers stretches out as far as the eye can see, each one a different color and shape. In the distance, a massive tree towers over the landscape, its branches reaching up to the sky like tentacles.\"" + "\n\n";

  let prompt = prompt_awesome + "You are an awesome Midjourney prompt generator. " 
                              + "User provides you, what they desired picture description. You'll add your imagination on it." + "\n"
                              + "User may provide you the last Midjourney prompt, you will need to modify it base on a new requirement." + "\n"
                              + "The input maybe not English, please translate and always use English as prompt." + "\n"
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
                              + "--ar is required, please must include this parameter. \n"
                              + "If you know how to use Midjourney, please add your parameters to the prompt. \n"
                              + "Remember if user asked a question not related to image generation, you should response an empty query as follows: \n\n"
                              + "{" + "\n"
                              + "  \"prompt\": \"\"" + "\n"
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
    return (JSON.parse(result)).prompt;
  } catch (error) {
    console.error(error);
    return null;
  }
}
