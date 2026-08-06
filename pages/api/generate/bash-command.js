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

// Generate bash command
export default async function (req, res) {
  // Access log
  log(req);

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
  const tagged = extractIpTag(req.query.user_input);
  let input_ = tagged.text;
  const taggedIp = tagged.ip;
  let inputType = TYPE.Normal;

  // Shell context
  const environment_context_ = req.query.environment_context || "";

  // If input is all empty, return
  if (input_ === "") {
    updateStatus("Input empty.");
    console.error("\nInput cannot be empty.");
    res.write(`data: ###ERR###Input cannot be empty.\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Output
  let output = "";
  let outputType = TYPE.Normal;

  // Config (input)
  const time_ = req.query.time || "";
  const session = req.query.session || "";

  // Request info
  // A tag is only honoured on a request from this machine — that is the bridge, running
  // the CLI on someone's behalf, and the only party entitled to name a different user.
  // Anything arriving from elsewhere speaks for itself, so its own address wins and a tag
  // it carries is just text somebody typed.
  const requestIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const ip = isLocalRequestIp(requestIp) && taggedIp ? taggedIp : requestIp;
  const browser = req.headers['user-agent'];

  // Time
  let time = Number(time_);

  // Authentication
  const authResult = authenticate(req);
  let user = null;
  let authUser = null;
  if (authResult.success) {
    authUser = authResult.user;
    user = await getUser(authResult.user.username);
  }

  // Ensure session
  // In sessions table, create session if not exists
  await ensureSession(session, user ? user.username : "");

  updateStatus("Preparing...");

  // Session ID
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.write(`data: ###ERR###${verifyResult.message}\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Model switch
  let model_ = req.query.model || sysconf.model;
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

  console.log(chalk.yellowBright("\nInput (oneshot, session = " + session + (user ? ", user = " + user.username : "") + "):"));
  console.log(input_);

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
              "text": `Generate a one line bash command. Don't use Markdown, just the pure command. No explanations.\n\nEnvironment context:\n${environment_context_}`
            }
          ]
        },
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": input_
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
    console.log(chalk.blueBright("\nOutput (oneshot, session = " + session + (user ? ", user = " + user.username : "") + "):"));
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
    console.log("Error (Generate bash-command API):");
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
