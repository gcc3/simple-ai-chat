import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { authenticate } from "utils/authUtils";
import { verifySessionId } from "utils/sessionUtils";
import { getUacResult } from "utils/uacUtils";
import { getSystemConfigurations } from "utils/systemUtils";
import { ensureSession } from "utils/logUtils";
import { getUser } from "utils/sqliteUtils";
import { executeFunctions } from "function.js";
import { countToken } from "utils/tokenUtils.js";
import { logadd } from "utils/logUtils.js";


// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// System configurations
const sysconf = getSystemConfigurations();

export default async function(req, res) {
  // Input
  let input = req.body.user_input.trim() || "";
  let inputType = TYPE.NORMAL;
  const images = req.body.images || null;
  const files = req.body.files || null;

  // Output
  // This is only for generating messages, so no need output here.
  let eval_ = "";
  let events = [];

  // Config (input)
  const time_ = req.body.time || "";
  const session = req.body.session || "";
  const mem_length = req.body.mem_length || 0;
  const functions_ = req.body.functions || "";
  const role = req.body.role || "";
  const stores = req.body.stores || "";
  const node = req.body.node || "";
  const use_stats = req.body.use_stats || false;
  const use_eval_ = req.body.use_eval || false;
  const use_location = req.body.use_location || false;
  const location = req.body.location || "";
  const lang = req.body.lang || "en-US";
  const use_system_role = req.body.use_system_role || true;

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];

  // Time
  let time = Number(time_);

  // Authentication
  // TODO, add authentication, only allow authenticated users to access this API
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

  // Session
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.status(400).json({
      success: false,
      error: verifyResult.message,
    });
    return;
  }

  // Model switch
  let model = req.body.model || sysconf.model;
  const use_vision = images && images.length > 0;
  const use_eval = use_eval_ && use_stats && !use_vision;

  // User access control
  if (sysconf.use_access_control) {
    const uacResult = await getUacResult(user, ip);
    if (!uacResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: uacResult.error,
        }
      });
      return;
    }
  }

  // Type I. Normal input
  if (!input.startsWith("!")) {
    inputType = TYPE.NORMAL;
    console.log(chalk.yellowBright("\nInput (msg, session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log(input);

    // Images & files
    if (images && images.length > 0) {
      console.log("\n--- images ---");
      console.log(images.join("\n"));
    }
    if (files && files.length > 0) {
      console.log("\n--- files ---");
      console.log(files.join("\n"));
    }

    // Configuration info
    console.log("\n--- configuration info ---\n"
    + "lang: " + lang + "\n"
    + "model: " + model + "\n"
    + "temperature: " + sysconf.temperature + "\n"
    + "top_p: " + sysconf.top_p + "\n"
    + "use_system_role: " + use_system_role + "\n"
    + "role_content_system (chat): " + sysconf.role_content_system.replaceAll("\n", " ") + "\n"
    + "use_vision: " + use_vision + "\n"
    + "use_eval: " + use_eval + "\n"
    + "use_node_ai: " + sysconf.use_node_ai + "\n"
    + "use_location: " + use_location + "\n"
    + "location: " + (use_location ? (location === "" ? "___" : location) : "(disabled)") + "\n"
    + "functions: " + (functions_ || "___") + "\n"
    + "role: " + (role || "___") + "\n"
    + "stores: " + (stores || "___") + "\n"
    + "node: " + (node || "___"));
  }

  // Type II. Tool calls (function calling) input
  // Tool call input starts with "!" with fucntions, following with a user input starts with "Q="
  // Example: !func1(param1),!func2(param2),!func3(param3) T=[{"index:0..."}] R=3:18 PM Q=Hello
  let functionNames = [];    // functionc called
  let functionCalls = [];    // function calls in input
  let functionCallingResults = [];  // function call results
  if (input.startsWith("!")) {
    inputType = TYPE.TOOL_CALL;
    console.log(chalk.cyanBright("\nInput Tool Calls (msg, session = " + session + (user ? ", user = " + user.username : "") + "):"));
    console.log(input);
 
    // OpenAI support function calling in tool calls.
    console.log("\n--- function calling ---");

    // Function name and arguments
    const functions = input.split("T=")[0].trim().substring(1).split(",!");
    console.log("Functions: " + JSON.stringify(functions));

    // Tool calls
    functionCalls = JSON.parse(input.split("T=")[1].trim().split("R=")[0].trim());

    // Tool calls result (frontend)
    functionCallingResults = JSON.parse(input.split("T=")[1].split("Q=")[0].trim().split("R=")[1].trim());
    if (functionCallingResults && functionCallingResults.length > 0) {
      console.log("Frontend function calling results: " + JSON.stringify(functionCallingResults));
    }

    // Backend function calling
    if (functionCallingResults.length == 0) {
      // Result format:
      // {
      //   success: true,
      //   function: f,
      //   message: result.message,
      //   event: result.event,
      // }
      functionCallingResults = await executeFunctions(functions);
      console.log("Backend function calling result:" + JSON.stringify(functionCallingResults));

      // Some results process
      if (functionCallingResults.length > 0) {
        for (let i = 0; i < functionCallingResults.length; i++) {
          const f = functionCallingResults[i];
          const c = functionCalls[i];  // not using here.

          // Add function name
          const functionName = f.function.split("(")[0].trim();
          if (functionNames.indexOf(functionName) === -1) {
            functionNames.push(functionName);
          }

          // Trigger frontend event
          if (f.event) {
            const event = JSON.stringify(f.event);
            res.write(`data: ###EVENT###${event}\n\n`);  // send event to frontend
          }
        }
      }
    }

    // Replace input with original user input
    input = input.split("Q=")[1].trim();
  }

  try {
    // Messages
    const msg = await generateMessages(use_system_role, lang,
                                       user, model,
                                       input, inputType, files, images,
                                       session, mem_length,

                                       // Role, Stores, Node
                                       role, stores, node,

                                       // Location info
                                       use_location, location,

                                       // Function calling
                                       functionCalls, functionCallingResults,
                                      
                                       // Callbacks
                                       null, null);
    
    console.log("\n--- messages ---");
    console.log(JSON.stringify(msg.messages));
    console.log("\nMessage completed.\n");

    // Log (chat history)
    // Must add tool calls log first, then add the general input output log
    // 1. tool calls log
    if (functionCalls && functionCalls.length > 0 && functionCallingResults && functionCallingResults.length > 0) {
      for (let i = 0; i < functionCallingResults.length; i++) {
        const f = functionCallingResults[i];
        const c = functionCalls[i];

        // Add log
        if (c.type === "function" && c.function && c.function.name === f.function.split("(")[0].trim()) {
          const input_f = "F=" + JSON.stringify(c);
          let output_f = f.success ? "F=" + f.message : "F=Error: " + f.error;
          const input_token_ct_f = countToken(model, input_f);
          const output_token_ct_f = countToken(model, output_f);
          await logadd(user, session, time++, model, input_token_ct_f, input_f, output_token_ct_f, output_f, JSON.stringify([]), ip, browser);
        }
      }
    }

    // Result
    res.status(200).json({
      result: {
        msg: msg,
        events: events,
        stats: {
          temperature: sysconf.temperature,
          top_p: sysconf.top_p,
          token_ct: 0,
          mem: msg.mem,
          func: functionNames.join('|'),
          role: role,
          stores: stores,
          node: node,
          eval: eval_
        }
      },
    });
  } catch (error) {
    console.error("Error (Generate Messages):");
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json({
        success: false,
        error: error.response.data
      });
    } else {
      console.error(`${error.message}`);
      res.status(500).json({
        success: false,
        error: "An error occurred during your request.",
      });
    }
  }
}
