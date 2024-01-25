import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils.js";
import { authenticate } from "utils/authUtils";
import { verifySessionId } from "utils/sessionUtils";
import { getUacResult } from "utils/uacUtils";
import { countToken } from "utils/tokenUtils";
import { getSystemConfigurations } from "utils/sysUtils";
import { ensureSession } from "utils/logUtils";

// OpenAI
const openai = new OpenAI();

// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// configurations
const { model : model_, model_v, role_content_system, welcome_message, querying, waiting, init_placeholder, enter, temperature, top_p, max_tokens, use_function_calling, use_node_ai, use_payment, use_access_control, use_email } = getSystemConfigurations();

export default async function(req, res) {
  const session = req.body.session || "";
  const time = req.body.time || "";
  const mem_length = req.body.mem_length || 0;
  const functions_ = req.body.functions || "";
  const role = req.body.role || "";
  const store = req.body.store || "";
  const node = req.body.node || "";
  const use_stats = req.body.use_stats || false;
  const use_eval_ = req.body.use_eval || false;
  const use_location = req.body.use_location || false;
  const location = req.body.location || "";
  const files = req.body.files || null;
  const images = req.body.images || null;
  const use_system_role = req.body.use_system_role || false;

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];

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

  // Input & output
  let input = "";
  let inputType = TYPE.NORMAL;
  let output = "";
  let outputType = TYPE.NORMAL;

  // Session
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.status(400).send(verifyResult.message);
    return;
  }

  // User access control
  if (use_access_control) {
    const uacResult = await getUacResult(user, ip);
    if (!uacResult.success) {
      res.status(400).send(uacResult.error);
      return;
    }
  }

  // Input
  input = req.body.user_input || "";
  if (input.trim().length === 0) return;
  console.log(chalk.yellowBright("\nInput (session = " + session + "):"));
  console.log(input + "\n");

  // Model switch
  const use_vision = images.length > 0;
  const model = use_vision ? model_v : model_;
  const use_eval = use_eval_ && use_stats && !use_vision;

  // Configuration info
  console.log("--- configuration info ---\n" 
  + "model: " + model + "\n"
  + "temperature: " + temperature + "\n"
  + "top_p: " + top_p + "\n"
  + "role_content_system (chat): " + role_content_system.replaceAll("\n", " ") + "\n"
  + "max_tokens: " + max_tokens + "\n"
  + "use_vision: " + use_vision + "\n"
  + "use_eval: " + use_eval + "\n"
  + "use_function_calling: " + use_function_calling + "\n"
  + "use_node_ai: " + use_node_ai + "\n"
  + "use_lcation: " + use_location + "\n"
  + "location: " + (use_location ? (location === "" ? "(not set)" : location) : "(disabled)") + "\n"
  + "functions: " + (functions_ || "(not set)") + "\n"
  + "role: " + (role || "(not set)") + "\n"
  + "store: " + (store || "(not set)") + "\n"
  + "node: " + (node || "(not set)") + "\n");

  try {
    let token_ct;  // input token count
    let messages = [];
    let mem = 0;

    const generateMessagesResult = await generateMessages(use_system_role, 
                                                          user, model, input, inputType, files, images, 
                                                          session, mem_length,
                                                          role, store, node,
                                                          use_location, location, 
                                                          false, null, null);  // tool calls (function calling) is not supported
    token_ct = generateMessagesResult.token_ct;
    messages = generateMessagesResult.messages;
    mem = generateMessagesResult.mem;

    // endpoint: /v1/chat/completions
    let chatCompletion;
    chatCompletion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      top_p,
      max_tokens,
    });

    // Get result
    const choices = chatCompletion.choices;
    if (!choices || choices.length === 0) {
      console.log(chalk.redBright("Error (session = " + session + "):"));
      console.error("No choice\n");
      output = "Silent...";
    } else {
      output = choices[0].message.content;
    }

    // Output the result
    if (output.trim().length === 0) output = "(null)";
    console.log(chalk.blueBright("Output (session = "+ session + "):"));
    console.log(output + "\n");

    // Log
    const input_token_ct = token_ct.total;
    const output_token_ct = countToken(model, output);
    logadd(user, session, time, model, input_token_ct, input, output_token_ct, output, JSON.stringify(images), ip, browser);

    res.status(200).json({
      result: {
        text : output,
        stats: {
          temperature: process.env.TEMPERATURE,
          top_p: process.env.TOP_P,
          token_ct: input_token_ct,
          mem: mem,
          func: false,
          role: role,
          store: store,
          node: node,
        },
        info: {
          model: process.env.MODEL,
        }
      },
    });
  } catch (error) {
    console.log("Error (Generate API):");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}
