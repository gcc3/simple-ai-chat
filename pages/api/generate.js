import { Configuration, OpenAIApi } from "openai";
import { parse } from 'csv-parse';
import chalk from 'chalk';

// OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// For csv paser
const fs = require("fs");

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

  const query_id = Date.now();

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
  let userInput = req.body.user_input || "";
  if (userInput.trim().length === 0) return;
  userInput = prompt_prefix + userInput + prompt_suffix;
  console.log(chalk.yellowBright("Input (query_id = " + query_id + "):"));
  console.log(userInput + "\n");

  try {
    let result_text = "";

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

async function generateMessages(userInput) {
  let messages = [];
  // System message, important
  messages.push({ role: "system", content: role_content_system });

  // Dictionary search
  if (process.env.DICT_SEARCH == "true") {
    console.log("--- dictionary search ---");
    const entries = await keywordExtraction(userInput);
    const definations = await dictionarySearch(entries);
    console.log("search result: " + definations + "\n");

    // Add definations to messages
    definations.map(entry => {
      const message = entry[0] + "についての説明は以下の通り：" + entry[1]
      if (messages.length <= 8)
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
  let topics = [];
  const sentences = userInput.split(/[、，,。.]+/);
  for (const sentence of sentences) {
    // Simple extraction
    // Topic is a keyword
    let topic  = ""
    if (sentence.includes("の意味")) topic = sentence.substring(0, sentence.search("の意味"));
    else if (sentence.includes("について")) topic = sentence.substring(0, sentence.search("について"));
    else if (sentence.includes("とは")) topic = sentence.substring(0, sentence.search("とは"));
    else if (sentence.includes("は何")) topic = sentence.substring(0, sentence.search("は何"));
    else if (sentence.includes("はなん")) topic = sentence.substring(0, sentence.search("はなん"));
    if (topic !== "") topics.push(topic.trim());
  }
  console.log("topics: " + topics);

  // Keyword extraction from goo API
  let keywords = [];
  await fetch('https://labs.goo.ne.jp/api/keyword', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      app_id: process.env.GOO_API_APP_ID,
      title: "",
      body: userInput,
      focus: "ORG",
    })
  })
  .then(response => response.json())
  .then(data => {
    data.keywords.forEach(entry => {
      for (const [key, value] of Object.entries(entry)) {
        keywords.push(key.trim());
      }
    });
  });
  console.log("keywords: " + keywords);

  // NER from goo API
  let ner = [];
  await fetch('https://labs.goo.ne.jp/api/entity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      app_id: process.env.GOO_API_APP_ID,
      sentence: userInput,
    })
  })
  .then(response => response.json())
  .then(data => {
    data.ne_list.forEach(entry => {
      ner.push(entry[0]);
    });
  });
  console.log("ner: " + ner);

  // Morphological analysis from goo API
  let morph = []
  await fetch('https://labs.goo.ne.jp/api/morph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      app_id: process.env.GOO_API_APP_ID,
      sentence: userInput,
      info_filter: "form",
      pos_filter: "名詞|冠名詞"
    })
  })
  .then(response => response.json())
  .then(data => {
    data.word_list[0].forEach(entry => {
      morph.push(entry[0]);
    });
  });
  console.log("morph: " + morph);

  return {
    topics: topics,
    keywords: keywords,
    ner: ner,
    morph: morph,
  };
}

async function dictionarySearch(entries) {
  const topics = entries.topics;
  const keywords = entries.keywords;
  const ner = entries.ner;
  const morph = entries.morph;

  let definations_topics = [];
  let definations_keywords = [];
  let definations_sub = [];
  const parser = fs.createReadStream("./dict.csv", { encoding: "utf8" })
  .pipe(parse({separator: ',', quote: '\"'}))
  for await (const record of parser) {
    for (const topic of topics) {
      if (record[0].includes(topic)) {
        definations_topics.push(record);
        break;
      }
    }

    for (const keyword of keywords) {
      if (record[0].includes(keyword)) {
        definations_keywords.push(record);
        break;
      }
    }

    for (const sub of ner.concat(morph)) {
      if (record[0].includes(sub)) {
        definations_sub.push(record);
        break;
      }
    }
  }

  let definations = [];
  for (const def of definations_topics) {
    definations.push(def);
    if (definations.length >= 8) break;
  }

  for (const def of definations_keywords) {
    definations.push(def);
    if (definations.length >= 8) break;
  }

  for (const def of definations_sub) {
    definations.push(def);
    if (definations.length >= 8) break;
  }
  return definations;
}