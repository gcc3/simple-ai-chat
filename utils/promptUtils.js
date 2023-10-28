// Prompt Utils
// to generate prompt for textCompletion
// to generte messages for chatCompletion
// extracting keywords, and searching dictionary
import { dictionarySearch } from './dictionaryUtils.js';
import { loglist } from './logUtils.js';
import { rolePrompt } from './roleUtils.js';

// configurations
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const fine_tune_stop = process.env.FINE_TUNE_STOP ? process.env.FINE_TUNE_STOP : "";
const fine_tune_prompt_end = process.env.FINE_TUNE_PROMPT_END ? process.env.FINE_TUNE_PROMPT_END : "";
const prompt_prefix = process.env.PROMPT_PREFIX ? process.env.PROMPT_PREFIX : "";
const prompt_suffix = process.env.PROMPT_SUFFIX ? process.env.PROMPT_SUFFIX : "";
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : 700;
const token_limit = 4000;

// Generate messages for chatCompletion
export async function generateMessages(input, queryId, role, tokenizer) {
  let messages = [];
  let token_ct = 0;
  token_ct += tokenizer.encode(input).length;
  
  // System message, important
  if (role_content_system !== "") {
    messages.push({ role: "system", content: role_content_system });
    token_ct += tokenizer.encode(role_content_system).length;
  }

  // Roleplay role prompt
  if (role !== "" && role !== "default") {
    messages.push({ role: "system", content: await rolePrompt(role) });
    token_ct += tokenizer.encode(role).length;
  }

  // Dictionary search
  let score = 0;
  let definitions = [];
  if (process.env.DICT_SEARCH == "true") {
    console.log("--- dictionary search ---");
    const entries = await keywordExtraction(input);
    const dictionarySearchResult = await dictionarySearch(entries);
    score = dictionarySearchResult.score;
    definitions = dictionarySearchResult.def;
    console.log("search result: " + definitions.join("/ "));
    console.log("dict search score: " + score + "\n");

    // Add definitions to messages
    dictionarySearchResult.def.map(entry => {
      // At most push 5 definitions
      if (messages.length < 6) {
        const message = "The explanation for \"" + entry[0] + "\" is as follows\n\n\"\"\"\n" + entry[1] + "\n\"\"\"";
        if (token_ct + tokenizer.encode(message).length < token_limit - max_tokens) {
          messages.push({ role: "system", content: message });
          token_ct += tokenizer.encode(message).length;
        }
      }
    });
  }

  // Chat history
  const loglistForSession = await loglist(queryId, 35);
  if (loglistForSession !== "") {
    let chatSets = [];
    for (const line of loglistForSession.split("\n")) {
      const question = line.substring(line.search("Q=") + 2, line.search(" A=")).trim();
      const answer = line.substring(line.search("A=") + 2).trim();
      if (token_ct + tokenizer.encode(question + answer).length < token_limit - max_tokens) {
        chatSets.push({ question: question, answer: answer });
        token_ct += tokenizer.encode(question + answer).length;
      } else {
        break;
      }
    }

    // Add chat history to messages
    chatSets.reverse().map(chatSet => {
      messages.push({ role: "user", content: chatSet.question });
      messages.push({ role: "assistant", content: chatSet.answer });
    });
  }

  // Finally, insert user input
  messages.push({ role: "user", content: input });
  return {
    messages: messages,
    definitions: definitions,
    score: score,
    token_ct: token_ct,
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

    // Extract topic for Japanese
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

function tokenizer(model, messages) {
  const enc = get_encoding("gpt2");
}
