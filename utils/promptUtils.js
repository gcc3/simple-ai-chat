// Prompt Utils
// to generate prompt for textCompletion
// to generte messages for chatCompletion
// extracting keywords, and searching dictionary
import { dictionarySearch } from './dictionaryUtils.js';
import { loglist } from './logUtils.js';
import { rolePrompt } from './roleUtils.js';
import { getMaxTokens } from './tokenUtils.js';

// configurations
const model = process.env.MODEL ? process.env.MODEL : "";
const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
const prompt_prefix = process.env.PROMPT_PREFIX ? process.env.PROMPT_PREFIX : "";
const prompt_suffix = process.env.PROMPT_SUFFIX ? process.env.PROMPT_SUFFIX : "";
const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : getMaxTokens(model);

// Generate messages for chatCompletion
export async function generateMessages(input, images, queryId, role) {
  let messages = [];
  let token_ct = 0;
  
  // System message, important
  if (role_content_system !== "") {
    messages.push({ role: "system", content: role_content_system });
  }

  // Roleplay role prompt
  if (role !== "" && role !== "default") {
    messages.push({ role: "system", content: await rolePrompt(role) });
  }

  // Dictionary search prompt
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
        messages.push({ role: "system", content: message });
      }
    });
  }

  // Chat history
  const session = queryId;
  const loglistForSession = await loglist(session);

  if (loglistForSession !== "") {
    let chatSets = [];
    for (const line of loglistForSession.split("\n")) {
      const question = line.substring(line.search("Q=") + 2, line.search(" A=")).trim();
      const answer = line.substring(line.search("A=") + 2).trim();
      chatSets.push({ question: question, answer: answer });
    }

    // Add chat history to messages
    chatSets.reverse().map(chatSet => {
      messages.push({ 
        role: "user",
        content: [
          {
            type: "text",
            text: chatSet.question
          }
        ]
      });
      
      messages.push({ 
        role: "assistant", 
        content: chatSet.answer 
      });
    });
  }

  // Finally, insert user input
  messages.push({ 
    role: "user", 
    content: (() => {
      let c = [];

      // Text
      c.push({
          type: "text",
          text: input
      });

      // Vision model
      // If images is not empty, add image to content
      if (images) {
        images.split(",").map(image => {
          if (image !== "") {
            c.push({
              type: "image",
              image: {
                url: image
              }
            });
          }
        });
      }
      return c;
    })()  // Immediately-invoked function expression (IIFE)
  });

  return {
    messages: messages,
    definitions: definitions,
    score: score,
    token_ct: token_ct,
  };
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
