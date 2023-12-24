import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils.js";
import { authenticate } from "utils/authUtils";
import { verifySessionId } from "utils/sessionUtils";
import { getUacResult } from "utils/uacUtils";
import { countToken } from "utils/tokenUtils";
import { getSystemConfigurations } from "utils/sysUtils";

// OpenAI
const openai = new OpenAI();

// configurations
const { model : model_, model_v, role_content_system, welcome_message, querying, waiting, init_placeholder, enter, temperature, top_p, max_tokens, use_function_calling, use_node_ai, use_vector, use_payment, use_access_control, use_email } = getSystemConfigurations();

export default async function(req, res) {
  const queryId = req.body.query_id || "";
  const role = req.body.role || "";
  const store = req.body.store || "";
  const node = req.body.node || "";
  const use_stats = req.body.use_stats || false;
  const use_eval_ = req.body.use_eval || false;
  const use_location = req.body.use_location || false;
  const location = req.body.location || "";
  const files = req.body.files || null;
  const images = req.body.images || null;
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

  // Input & output
  let input = "";
  let output = "";

  // Query ID, same as session ID
  const verifyResult = verifySessionId(queryId);
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
  console.log(chalk.yellowBright("\nInput (query_id = " + queryId + "):"));
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
  + "role_content_system (chat): " + role_content_system + "\n"
  + "max_tokens: " + max_tokens + "\n"
  + "use_vision: " + use_vision + "\n"
  + "use_eval: " + use_eval + "\n"
  + "use_function_calling: " + use_function_calling + "\n"
  + "use_node_ai: " + use_node_ai + "\n"
  + "use_vector: " + use_vector + "\n"
  + "use_lcation: " + use_location + "\n"
  + "location: " + location + "\n"
  + "role: " + (role || "(not set)") + "\n"
  + "store: " + (store || "(not set)") + "\n");

  try {
    let token_ct;  // input token count
    let messages = [];

    const generateMessagesResult = await generateMessages(user, model, input, files, images, queryId, role, store, use_location, location, false);  // function calling is not supported
    token_ct = generateMessagesResult.token_ct;
    messages = generateMessagesResult.messages;

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
      console.log(chalk.redBright("Error (query_id = " + queryId + "):"));
      console.error("No choice\n");
      output = "Silent...";
    } else {
      output = choices[0].message.content;
    }

    // Output the result
    if (output.trim().length === 0) output = "(null)";
    console.log(chalk.blueBright("Output (query_id = "+ queryId + "):"));
    console.log(output + "\n");

    // Log
    const input_token_ct = token_ct.total;
    const output_token_ct = countToken(model, output);
    logadd(user, queryId, model, input_token_ct, input, output_token_ct, output, ip, browser);

    res.status(200).json({
      result: {
        text : output,
        stats: {
          temperature: process.env.TEMPERATURE,
          top_p: process.env.TOP_P,
          token_ct: input_token_ct,
          func: false,
          role: role,
          store: store,
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
