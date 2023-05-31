// Prompt Utils
// to generate prompt for textCompletion
// to generte messages for chatCompletion
// extracting keywords, and searching dictionary
import { dictionarySearch } from './dictionaryUtils.js';
import { loglist } from './logUtils.js';

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const fine_tune_stop = process.env.FINE_TUNE_STOP ? process.env.FINE_TUNE_STOP : "";
const fine_tune_prompt_end = process.env.FINE_TUNE_PROMPT_END ? process.env.FINE_TUNE_PROMPT_END : "";
const prompt_prefix = process.env.PROMPT_PREFIX ? process.env.PROMPT_PREFIX : "";
const prompt_suffix = process.env.PROMPT_SUFFIX ? process.env.PROMPT_SUFFIX : "";
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : 500;
const stream_console = process.env.STREAM_CONSOLE == "true" ? true : false;

// Generate messages for chatCompletion
export async function generateMessages(userInput, queryId) {
  let messages = [];
  // System message, important
  messages.push({ role: "system", content: role_content_system });

  // Dictionary search
  let score = 0;
  if (process.env.DICT_SEARCH == "true") {
    console.log("--- dictionary search ---");
    const entries = await keywordExtraction(userInput);
    const dictionarySearchResult = await dictionarySearch(entries);
    score = dictionarySearchResult.score;
    console.log("search result: " + dictionarySearchResult.def.join("/ "));
    console.log("credibility score: " + score + "\n");

    // Add definations to messages
    dictionarySearchResult.def.map(entry => {
      const message = entry[0] + "についての説明は以下の通り：" + entry[1]
      if (messages.length <= 8)
        messages.push({ role: "system", content: message });
    });
  }

  // Chat history
  const historyChat = await loglist(queryId);
  if (historyChat !== "") {
    for (const line of historyChat.split("\n")) {
      if (messages.length <= 8) {
        const question = line.substring(line.search("Q=") + 2, line.search(" A="));
        const answer = line.substring(line.search("A=") + 2);
        messages.push({ role: "user", content: question });
        messages.push({ role: "assistant", content: answer });
      }
    }
  }

  // Finally, insert user input
  messages.push({ role: "user", content: userInput });
  return { 
    messages: messages,
    score: score,
  };
}

// Generate prompt for textCompletion
export function generatePrompt(userInput) {
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
    else if (sentence.includes("ってなん")) topic = sentence.substring(0, sentence.search("ってなん"));
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
    sub: ner.concat(morph)
  };
}
