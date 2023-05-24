import { Configuration, OpenAIApi } from "openai";

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
  let userInput = req.query.user_input || "";
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
  + "role_content_system (chat) = " + process.env.ROLE_CONTENT_SYSTEM + "\n"
  + "prompt_prefix = " + process.env.PROMPT_PREFIX + "\n"
  + "prompt_suffix = " + process.env.PROMPT_SUFFIX + "\n"
  + "max_tokens = " + process.env.MAX_TOKENS + "\n");

  try {
    res.writeHead(200, {
      'connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',  // disables proxy buffering for NGINX
                                  // IMPORTANT! without this the stream not working on remote server
    });

    if (process.env.END_POINT === "chat_completion") {
      // endpoint: /v1/chat/completions
      const chatCompletion = openai.createChatCompletion({
        model: process.env.MODEL,
        messages: generateMessages(userInput),
        temperature: temperature,
        top_p: top_p,
        max_tokens: max_tokens,
        stream: true,
      }, { responseType: "stream" });

      res.write(`data: ###ENV###${process.env.MODEL},${process.env.TEMPERATURE},${process.env.TOP_P}\n\n`);
      chatCompletion.then(resp => {
        process.stdout.write("Output:\n");

        resp.data.on('data', data => {
          const lines = data.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            const chunkData = line.replace(/^data: /, '');

            // handle the DONE signal
            if (chunkData === '[DONE]') {
              res.write(`data: [DONE]\n\n`)
              process.stdout.write("\n\n");
              res.flush();
              res.end();
              return
            }

            // handle the message
            const content = JSON.parse(chunkData).choices[0].delta.content;
            if (content) {
              let message = "";
              message = content.replaceAll("\n", "###RETURN###");
              process.stdout.write(content);
              res.write(`data: ${message}\n\n`)
            }
            res.flush();
          }
        });
      })
    }

    if (process.env.END_POINT === "text_completion") {
      // endpoint: /v1/completions
      const completion = openai.createCompletion({
        model: process.env.MODEL,
        prompt: generatePrompt(userInput),
        temperature: temperature,
        top_p: top_p,
        stop: fine_tune_stop,
        max_tokens: max_tokens,
        stream: true,
      }, { responseType: "stream" });

      res.write(`data: ###ENV###${process.env.MODEL},${process.env.TEMPERATURE},${process.env.TOP_P}\n\n`);
      completion.then(resp => {
        process.stdout.write("Output:\n");

        resp.data.on('data', data => {
          const lines = data.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            const chunkData = line.replace(/^data: /, '');

            // handle the DONE signal
            if (chunkData === '[DONE]') {
              res.write(`data: [DONE]\n\n`)
              process.stdout.write("\n\n");
              res.flush();
              res.end();
              return
            }

            // handle the message
            const text = JSON.parse(chunkData).choices[0].text;
            if (text) {
              let message = "";
              message = text.replaceAll("\n", "###RETURN###");
              process.stdout.write(text);
              res.write(`data: ${message}\n\n`)
            }
            res.flush();
          }
        });
      })
    }
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

function generateMessages(userInput) {
  let messages = [];
  // System message, important
  messages.push({ role: "system", content: role_content_system });

  // Dictionary search
  if (process.env.DICT_SEARCH == "true") {
    const keywords = keywordExtraction(userInput);
    keywords.forEach(keyword => {
      const defination = dictionarySearch(keyword);
      if (defination !== "") {
        const message = keyword + "について、解釈は以下の通り：" + defination + "です。"
        messages.push({ role: "system", content: message });
      }
    });
  }

  // TODO here insert history messages (user and assistant messages)
  messages.push({ role: "user", content: userInput });
  return messages;
}

function generatePrompt(userInput) {
  let prompt = "";

  // Add fine tune prompt end
  prompt = userInput + fine_tune_prompt_end;
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
  if (topic !== "") keywords.push(topic);

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
        keywords.push(key);
      }
    });
  });

  return keywords;
}

function dictionarySearch(entry) {
  // TODO
  return "";
}