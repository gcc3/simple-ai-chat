import { Configuration, OpenAIApi } from "openai";

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

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
      },
    });
    return;
  }

  // Input
  let userInput = req.body.user_input || "";
  if (userInput.trim().length === 0) return;
  userInput = prompt_prefix + userInput + prompt_suffix;
  console.log("Input:\n" + userInput + "\n");

  // Configuration info
  console.log("--- configuration info ---\n" 
  + "model = " + process.env.MODEL + "\n"
  + "temperature = " + process.env.TEMPERATURE + "\n"
  + "top_p = " + process.env.TOP_P + "\n"
  + "endpoint = " + process.env.END_POINT + "\n"
  + "fine_tune_prompt_end (text) = " + process.env.FINE_TUNE_PROMPT_END + "\n"
  + "fine_tune_stop (text) = " + process.env.FINE_TUNE_STOP + "\n"
  + "role_content_system (chat) = " + process.env.ROLE_CONTENT_SYSTEM + "\n")
  + "prompt_prefix = " + process.env.PROMPT_PREFIX + "\n"
  + "prompt_suffix = " + process.env.PROMPT_SUFFIX + "\n"
  + "max_tokens = " + process.env.MAX_TOKENS + "\n";

  try {
    let result_text = "null";

    if (process.env.END_POINT === "chat_completion") {
      // endpoint: /v1/chat/completions
      const chatCompletion = await openai.createChatCompletion({
        model: process.env.MODEL,
        messages: generateMessages(userInput),
        temperature: temperature,
        top_p: top_p,
        max_tokens: max_tokens,
      });

      // Get result
      result_text = chatCompletion.data.choices[0].message.content;
    }

    if (process.env.END_POINT === "text_completion") {
      // endpoint: /v1/completions
      const completion = await openai.createCompletion({
        model: process.env.MODEL,
        prompt: generatePrompt(userInput),
        temperature: temperature,
        top_p: top_p,
        stop: fine_tune_stop,
        max_tokens: max_tokens,
      });

      // Get result
      result_text = completion.data.choices[0].text;
    }

    // Output the result
    console.log("Output:\n" + result_text + "\n");
    res.status(200).json({
      result: {
        text : result_text, 
        info: {
          model: process.env.MODEL,
          temperature: process.env.TEMPERATURE,
          top_p: process.env.TOP_P,
        }
      },
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

async function generateMessages(userInput) {
  let messages = [];
  // System message, important
  messages.push({ role: "system", content: role_content_system });

  // Dictionary search
  if (process.env.DICT_SEARCH == "true") {
    console.log("--- dictionary search ---");
    const keywords = await keywordExtraction(userInput);
    console.log("keywords: " + keywords);
    const definations = await dictionarySearch(keywords);
    console.log("result: " + definations + "\n");

    // Add definations to messages
    definations.map(entry => {
      const message = entry[0] + "について、解釈は以下の通り：" + entry[1] + "です。"
      messages.push({ role: "system", content: message });
    });
  }

  // TODO here insert history messages (user and assistant messages)
  messages.push({ role: "user", content: userInput });
  return messages;
}

function generatePrompt(userInput) {
  // Add fine tune prompt end
  const prompt = userInput + fine_tune_prompt_end;
  return prompt;
}

async function keywordExtraction(userInput) {
  let keywords = [];

  // 1. Simple extraction
  // Topic is a keyword
  let topic  = ""
  if (userInput.includes("の意味")) topic = userInput.split("の意味")[0];
  if (userInput.includes("とは")) topic = userInput.split("とは")[0];
  if (userInput.includes("は何")) topic = userInput.split("って何")[0];
  if (userInput.includes("はなん")) topic = userInput.split("って何")[0];
  if (topic !== "") keywords.push(topic.trim());

  // 2. Keyword extraction from goo API
  await fetch('https://labs.goo.ne.jp/api/keyword', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      app_id: process.env.GOO_API_APP_ID,
      title: "",
      body: userInput,
      max_num: 5,
    })
  })
  .then(response => response.json())
  .then(data => {
    data.keywords.forEach(keyword => {
      for (const [key, value] of Object.entries(keyword)) {
        keywords.push(key.trim());
      }
    });
  });

  return keywords;
}

async function dictionarySearch(entries) {
  let definations = [];
  const parser = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"'}))
  for await (const record of parser) {
    for (const entry of entries) {
      if (record[0] === entry) {
        definations.push(record);
      }
    }
  }
  return definations;
}
