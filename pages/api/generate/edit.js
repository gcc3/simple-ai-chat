import OpenAI from "openai";
import chalk from 'chalk';
import { logadd } from "utils/server/log";
import { verifySessionId } from "utils/session";
import { authenticate } from "utils/auth";
import { getUacResult } from "utils/uac";
import { getModels, getUser } from "utils/sqlite";
import { getSystemConfigurations } from "utils/server/system";
import { ensureSession } from "utils/server/log.js";
import { addUserUsage } from "utils/sqlite.js";
import { extractIpTag, isLocalRequestIp } from "utils/ip.js";
import { TYPE } from '../../../constants.js';
import log from "../../../log.js";

// System configurations
const sysconf = getSystemConfigurations();

// Models
let models = await getModels();

// Generate edited content
// The content can be long, so the parameters can be sent by request body (POST) as well as query string (GET).
export default async function (req, res) {
  // Access log
  log(req);

  // Parameters can be provided by request body or query string
  const params = { ...(req.query || {}), ...(req.body || {}) };

  res.writeHead(200, {
    'connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',  // disables proxy buffering for NGINX
    // IMPORTANT! without this the stream not working on remote server
  });

  // Update stats callback
  const updateStatus = (status) => {
    res.write(`data: ###STATUS###${status}\n\n`); res.flush();
  }

  // Input
  // Stripped of its `@ip[...]` tag before anything else looks at it, so the tag reaches
  // neither the model nor the log; `taggedIp` is the user the bridge sent it for.
  const tagged = extractIpTag(params.prompt);
  let input_ = tagged.text;  // the prompt, tells how the content will be edited
  const taggedIp = tagged.ip;
  let inputType = TYPE.Normal;

  // Content to edit, and a static description of what the content is
  const content_ = String(params.content ?? "");
  const instruct_ = String(params.instruct ?? "");

  // If prompt is all empty, return
  if (input_ === "") {
    updateStatus("Prompt empty.");
    console.error("\nPrompt cannot be empty.");
    res.write(`data: ###ERR###Prompt cannot be empty.\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // If content is all empty, return
  if (content_.trim() === "") {
    updateStatus("Content empty.");
    console.error("\nContent cannot be empty.");
    res.write(`data: ###ERR###Content cannot be empty.\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Output
  let output = "";
  let outputType = TYPE.Normal;

  // Config (input)
  const time_ = params.time || "";
  const session = params.session || "";

  // Request info
  // A tag is only honoured on a request from this machine — that is the bridge, running
  // the CLI on someone's behalf, and the only party entitled to name a different user.
  // Anything arriving from elsewhere speaks for itself, so its own address wins and a tag
  // it carries is just text somebody typed.
  const requestIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const ip = isLocalRequestIp(requestIp) && taggedIp ? taggedIp : requestIp;
  const browser = req.headers['user-agent'];

  // Time
  // The log time is the log's own ID, and a session can be branched from it,
  // so a missing or broken `time` must fallback to now instead of becoming 0.
  let time = Number(time_);
  if (!Number.isFinite(time) || time <= 0) {
    time = Date.now();
  }

  // Authentication
  const authResult = authenticate(req);
  let user = null;
  if (authResult.success) {
    user = await getUser(authResult.user.username);
  }

  // Ensure session
  // In sessions table, create session if not exists
  await ensureSession(session, user ? user.username : "");

  updateStatus("Preparing...");

  // Session ID
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.write(`data: ###ERR###${verifyResult.error}\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Model switch
  let model_ = params.model || sysconf.model;
  let model = models.find(m => m.name === model_);

  // Already setup models but not found
  if (!model) {
    // Try update models
    models = await getModels();
    model = models.find(m => m.name === model_);
    if (!model) {
      updateStatus("Model not exists.");
      res.write(`data: ###ERR###Model not exists.\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }
  }

  // Model properties
  const is_reasoning_model = model.is_reasoning === "1";

  // Model API key check
  if (!model.api_key) {
    updateStatus("Model's API key is not set.");
    res.write(`data: ###ERR###Model's API key is not set.\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  // Model API base URL check
  if (!model.base_url) {
    updateStatus("Model's base URL is not set.");
    res.write(`data: ###ERR###Model's base URL is not set.\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  // OpenAI
  const openai = new OpenAI({
    apiKey: model.api_key,
    baseURL: model.base_url,
  });

  // Stream output
  const streamOutput = (message, model = null) => {
    message = message.replaceAll("\n", "###RETURN###");
    res.write(`data: ${message}\n\n`); res.flush();

    if (model) {
      res.write(`data: ###MODEL###${model}\n\n`); res.flush();
    }
  }

  // User access control
  if (sysconf.use_access_control) {
    const uacResult = await getUacResult(user, ip, session, input_);
    if (!uacResult.success) {
      res.write(`data: ###ERR###${uacResult.error}\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }
  }

  console.log(chalk.yellowBright("\nInput (edit, session = " + session + (user ? ", user = " + user.username : "") + "):"));
  if (instruct_) console.log("Instruct: " + instruct_);
  console.log("Prompt: " + input_);
  console.log("Content:\n" + content_);

  try {
    // endpoint: /v1/chat/completions
    updateStatus("Create chat completion.");

    // Reasoning model will start reasoning
    if (is_reasoning_model) {
      updateStatus("Start reasoning...");
    } else {
      updateStatus("Start generating...");
    }

    // OpenAI chat completion!
    let chatCompletionUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content": [
            {
              "type": "text",
              "text": `You're a content editor. You'll be given a content and an instruction of how to edit it, rewrite the content by following the instruction.\n\n`
                    + `Rules:\n`
                    + `- Output the full new content only, no explanations, no comments, and don't wrap it in Markdown code blocks.\n`
                    + `- Keep the original format, structure and language of the content, unless the instruction asks to change them.\n`
                    + `- Only change what the instruction asks for, keep the rest of the content as it is.\n`
                    + `- If the instruction cannot be applied, output the original content unchanged.`
                    + (instruct_ ? `\n\nWhat the content is:\n${instruct_}` : ``)
            }
          ]
        },
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": `Content:\n${content_}\n\nInstruction:\n${input_}`
            }
          ]
        }
      ],
      model: model_,
      n: 1,
      stream: true,
      stream_options: {
        include_usage: true,
      },
      temperature: sysconf.temperature,

      // conditional params
      ...(user ? { user: user.username } : {})
    });

    res.write(`data: ###MODEL###${model_}\n\n`);
    res.flush();

    // Handle output
    for await (const part of chatCompletion) {
      if (!part.choices) {
        continue;
      }

      if (part.choices.length > 0) {
        // Use a safe reference to delta since it can be undefined
        const delta = part.choices[0].delta || {};

        // Handle message output
        const content = delta.content;
        if (typeof content === 'string' && content.length > 0) {
          outputType = TYPE.Normal;
          output += content;
          streamOutput(content);
        }
      }

      // For the last part, it will include the usage
      if (part.usage) {
        chatCompletionUsage = part.usage;
      }
    }

    // Output
    console.log(chalk.blueBright("\nOutput (edit, session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log((output.trim() || "(null)"));

    // Log (chat history)
    // Token
    console.log("\n--- token_ct ---");
    console.log("response_token_ct: " + JSON.stringify(chatCompletionUsage));

    // Fee
    console.log("\n--- fee_calc ---");
    const input_fee = chatCompletionUsage.prompt_tokens * model.price_input;
    const output_fee = chatCompletionUsage.completion_tokens * model.price_output;
    const cost = input_fee + output_fee;
    console.log("input_fee = " + chatCompletionUsage.prompt_tokens + " * " + model.price_input + " = " + input_fee.toFixed(5));
    console.log("output_fee = " + chatCompletionUsage.completion_tokens + " * " + model.price_output + " = " + output_fee.toFixed(5));
    console.log("total_cost: " + cost.toFixed(5));
    if (user && user.username) {
      await addUserUsage(user.username, parseFloat(cost.toFixed(6)));
      console.log("💰 User usage added, user: " + user.username + ", total cost: " + cost.toFixed(5));
    }

    // Log
    await logadd(user, session, time++, model_, chatCompletionUsage.prompt_tokens, input_, chatCompletionUsage.completion_tokens, output, "[]", parseFloat(cost.toFixed(6)), ip, browser);

    // Done message
    updateStatus("Finished.");
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  } catch (error) {
    console.log("Error (Generate edit API):");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.write(`data: ###ERR###An error occurred during your request. (${error.response.status})\n\n`)
    } else {
      console.error(`${error.message}`);
      res.write(`data: ###ERR###An error occurred during your request.\n\n`)
    }
    res.flush();
    res.end();
  }
}
