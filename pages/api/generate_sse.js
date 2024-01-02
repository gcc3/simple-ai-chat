import OpenAI from "openai";
import chalk from 'chalk';
import { generateMessages } from "utils/promptUtils";
import { logadd } from "utils/logUtils";
import { evaluate } from './evaluate';
import { executeFunctions, getTools } from "function.js";
import { countToken, getMaxTokens } from "utils/tokenUtils";
import { verifySessionId } from "utils/sessionUtils";
import { authenticate } from "utils/authUtils";
import { getUacResult } from "utils/uacUtils";
import { getUser } from "utils/sqliteUtils";
import { getSystemConfigurations } from "utils/sysUtils";
import { doNodeOverrideOutput, findNode, isMultimodalityNode } from "utils/nodeUtils";
import update from "./role/update";
import { use } from "react";

// OpenAI
const openai = new OpenAI();

// Input output type
const TYPE = {
  NORMAL: 0,
  TOOL_CALL: 1
};

// configurations
const { model: model_, model_v, role_content_system, welcome_message, querying, waiting, init_placeholder, enter, temperature, top_p, max_tokens, use_function_calling: use_function_calling_, use_node_ai, use_payment, use_access_control, use_email } = getSystemConfigurations();

export default async function (req, res) {
  const session = req.query.session || "";
  const mem_length = req.query.mem_length || 0;
  const role = req.query.role || "";
  const store = req.query.store || "";
  const node = req.query.node || "";
  const use_stats = req.query.use_stats === "true" ? true : false;
  const use_eval_ = req.query.use_eval === "true" ? true : false;
  const use_location = req.query.use_location === "true" ? true : false;
  const location = req.query.location || "";
  const images_ = req.query.images || "";
  const files_ = req.query.files || "";
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
  let inputType = TYPE.NORMAL;
  let output = "";
  let outputType = TYPE.NORMAL;

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
  updateStatus("Preparing...");
  
  // Query ID, same as session ID
  const verifyResult = verifySessionId(session);
  if (!verifyResult.success) {
    res.write(`data: ${verifyResult.message}\n\n`); res.flush();
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  }

  // Input
  input = req.query.user_input.replaceAll("%", "％").trim();  // escape %
  input = decodeURIComponent(input) || "";
  if (input.trim().length === 0) return;

  // Images & files
  const decodedImages = decodeURIComponent(images_) || "";
  const decodedFiles = decodeURIComponent(files_) || "";
  let images = [];
  let files = [];
  if (decodedImages) {
    if (decodedImages.includes("###")) {
      images = decodedImages.split("###");
    } else {
      images.push(decodedImages);
    }
  }
  if (decodedFiles) {
    if (decodedFiles.includes("###")) {
      files = decodedFiles.split("###");
    } else {
      files.push(decodedFiles);
    }
  }

  // Load node
  const nodeInfo = user && await findNode(node, user.username);

  // Model switch
  // For Midjourney node, use version model to input image to AI.
  const use_vision = images.length > 0 || isMultimodalityNode(nodeInfo);
  const model = use_vision ? model_v : model_;
  const use_eval = use_eval_ && use_stats && !use_vision;

  // Use function calling
  // Function calling is not supported in vision models
  let use_function_calling = use_function_calling_;
  if (use_vision) {
    use_function_calling = false;
  }

  // User access control
  if (use_access_control) {
    const uacResult = await getUacResult(user, ip);
    if (!uacResult.success) {
      res.write(`data: ${uacResult.error}\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }
  }

  // Type I. Normal input
  if (!input.startsWith("!")) {
    inputType = TYPE.NORMAL;
    console.log(chalk.yellowBright("Input (session = " + session + "):"));
    console.log(input + "\n");

    // Images & files
    if (images.length > 0) {
      console.log("--- images ---");
      console.log(images.join("\n") + "\n");
    }
    if (files.length > 0) {
      console.log("--- files ---");
      console.log(files.join("\n") + "\n");
    }

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
    + "use_lcation: " + use_location + "\n"
    + "location: " + (use_location ? (location === "" ? "(not set)" : location) : "(disabled)") + "\n"
    + "role: " + (role || "(not set)") + "\n"
    + "store: " + (store || "(not set)") + "\n"
    + "node: " + (node || "(not set)") + "\n");
  }

  // Type II. Tool calls (function calling) input
  // Tool call input starts with "!" with fucntions, following with a user input starts with "Q="
  // Example: !func1(param1),!func2(param2),!func3(param3) Q=Hello
  let functionNames = [];
  let functionCalls = [];
  let functionResults = [];
  if (input.startsWith("!")) {
    if (!use_function_calling) {
      res.write(`data: Function calling is disabled. This may be due to the use of a vision model.\n\n`); res.flush();
      res.write(`data: [DONE]\n\n`); res.flush();
      res.end();
      return;
    }

    inputType = TYPE.TOOL_CALL;
    console.log(chalk.cyanBright("Tool calls (session = " + session + "):"));
 
    // Curerently OpenAI only support function calling in tool calls.
    // Function name and arguments
    const functions = input.split("T=")[0].trim().substring(1).split(",!");
    console.log("Functions: " + JSON.stringify(functions));

    // Tool calls
    functionCalls = JSON.parse(input.split("T=")[1].trim().split("Q=")[0].trim());

    // Replace input with original
    input = input.split("Q=")[1];

    // Execute function
    functionResults = await executeFunctions(functions);
    console.log("Result:" + JSON.stringify(functionResults) + "\n");
    if (functionResults.length > 0) {
      for (let i = 0; i < functionResults.length; i++) {
        const f = functionResults[i];
        const c = functionCalls[i];  // not using here.

        // Add function name
        const functionName = f.function.split("(")[0].trim();
        if (functionNames.indexOf(functionName) === -1) {
          functionNames.push(functionName);
        }

        // Trigger event
        // Function trigger event
        if (f.event) {
          const event = JSON.stringify(f.event);
          res.write(`data: ###EVENT###${event}\n\n`);  // send event to frontend
        }
      }
    }
  }

  try {
    let token_ct = [];  // detailed token count
    let input_token_ct = 0;
    let output_token_ct = 0;
    let messages = [];
    let raw_prompt = "";
    let mem = 0;
    let input_images = [];
    let node_input = "";
    let node_output = "";
    let node_output_images = [];
    let toolCalls = [];

    // Message base
    updateStatus("Start pre-generating...");
    const generateMessagesResult = await generateMessages(user, model, input, inputType, files, images, 
                                                          session, mem_length,
                                                          role, store, node, 
                                                          use_location, location,
                                                          use_function_calling, functionCalls, functionResults,
                                                          updateStatus);

    updateStatus("Pre-generating finished.");
    token_ct.push(generateMessagesResult.token_ct);
    messages = generateMessagesResult.messages;
    input_token_ct += generateMessagesResult.token_ct.total;
    raw_prompt = generateMessagesResult.raw_prompt;
    mem = generateMessagesResult.mem;
    input_images = generateMessagesResult.input_images;
    node_input = generateMessagesResult.node_input;
    node_output = generateMessagesResult.node_output;
    node_output_images = generateMessagesResult.node_output_images;

    if (node && nodeInfo) {
      // Add log for node
      // Use node as model name, TODO, use node response model name
      // For each image add a log
      if (node_input) {
        if (node_output_images.length > 0) {
          for (let i = 0; i < node_output_images.length; i++) {
            await logadd(user, session, node, 0, node_input, 0, node_output, JSON.stringify([node_output_images[i]]), ip, browser);
          }
        } else {
          await logadd(user, session, node, 0, node_input, 0, node_output, [], ip, browser);
        }
      }

      // Node taken output override
      if (doNodeOverrideOutput(nodeInfo)) {
        res.write(`data: ###ENV###${node.toLowerCase()}\n\n`);
        node_output_images.map(image => {
          res.write(`data: ###IMG###${image}\n\n`);
        });
        res.flush();

        const noddOutput = raw_prompt["node"];
        res.write(`data: ${noddOutput}\n\n`); res.flush();
        res.write(`data: [DONE]\n\n`); res.flush();
        res.end();
        return;
      }
    }

    // Get tools
    let tools = await getTools();

    console.log("--- tools ---");
    console.log(JSON.stringify(tools) + "\n");

    console.log("--- messages ---");
    console.log(JSON.stringify(messages) + "\n");

    // endpoint: /v1/chat/completions
    updateStatus("Start chat comletion streaming.");
    const chatCompletion = await openai.chat.completions.create({
      model,
      // response_format: { type: "json_object" },
      messages,
      temperature,
      top_p,
      max_tokens,
      stream: true,
      // vision does not support function calling
      ...(use_function_calling && !use_vision && {
        tools,
        tool_choice: "auto"
      })
    });

    res.write(`data: ###ENV###${model}\n\n`);
    res.write(`data: ###STATS###${temperature},${top_p},${input_token_ct + output_token_ct},${use_eval},${functionNames.join('|')},${role},${store},${node},${mem}\n\n`);
    input_images.map(image => {
      res.write(`data: ###IMG###${image}\n\n`);
    });
    res.flush();

    // Hanldle output
    for await (const part of chatCompletion) {
      // 1. handle message output
      const content = part.choices[0].delta.content;
      if (content) {
        outputType = TYPE.NORMAL;
        output += content;
        let message = content.replaceAll("\n", "###RETURN###");
        res.write(`data: ${message}\n\n`); res.flush();
      }

      // 2. handle tool calls output
      const tool_calls = part.choices[0].delta.tool_calls;
      if (tool_calls) {
        outputType = TYPE.TOOL_CALL;
        res.write(`data: ###CALL###${JSON.stringify(tool_calls)}\n\n`); res.flush();

        const toolCall = tool_calls[0];
        const toolCallSameIndex = toolCalls.find(t => t.index === toolCall.index);
        if (toolCallSameIndex) {
          // Found same index tool
          toolCallSameIndex.function.arguments += toolCall.function.arguments;
        } else {
          // If not found, add the tool
          toolCalls.push(toolCall);
        }
      }
    }

    // Evaluate result
    // vision models not support evaluation
    if (use_eval) {
      if (output.trim().length > 0) {
        const evalResult = await evaluate(user, input, raw_prompt, output);
        if (evalResult.success) {
          res.write(`data: ###EVAL###${evalResult.output}\n\n`); res.flush();
          console.log("eval: " + evalResult.output + "\n");
          output_token_ct += evalResult.token_ct;
        } else {
          res.write(`data: ###EVAL###${evalResult.error}\n\n`); res.flush();
        }
      }
    }

    // Token
    console.log("--- token_ct ---");
    console.log(JSON.stringify(token_ct) + "\n");

    // Output
    console.log(chalk.blueBright("Output (session = "+ session + "):"));
    console.log((output || "(null)") + "\n");

    // Tool calls output
    const output_tool_calls = JSON.stringify(toolCalls);
    if (output_tool_calls && toolCalls.length > 0) {
      console.log("--- tool calls ---");
      console.log(output_tool_calls + "\n");
    }

    // Token count and log
    // Must add tool calls log first, then add the general input output log
    // 1. tool calls
    if (functionCalls && functionCalls.length > 0 && functionResults && functionResults.length > 0) {
      for (let i = 0; i < functionResults.length; i++) {
        const f = functionResults[i];
        const c = functionCalls[i];

        // Add log
        if (c.type === "function" && c.function && c.function.name === f.function.split("(")[0].trim()) {
          const input_f = "F=" + JSON.stringify(c);
          let output_f = f.success ? "F=" + f.message : "F=Error: " + f.error;
          const input_token_ct_f = countToken(model, input_f);
          const output_token_ct_f = countToken(model, output_f);
          await logadd(user, session, model, input_token_ct_f, input_f, output_token_ct_f, output_f, [], ip, browser);
        }
      }
    }

    // 2. input
    output_token_ct += countToken(model, output);
    if (inputType === TYPE.TOOL_CALL) {
      // Function calling input is already logged
      input_token_ct = 0;
      input = "Q=" + input;
    }
    if (outputType === TYPE.TOOL_CALL) {
      // Add tool calls output to log
      output = "T=" + output_tool_calls;
    }
    await logadd(user, session, model, input_token_ct, input, output_token_ct, output, JSON.stringify(input_images), ip, browser);

    // Final stats
    res.write(`data: ###STATS###${temperature},${top_p},${input_token_ct + output_token_ct},${use_eval},${functionNames.join('|')},${role},${store},${node},${mem}\n\n`);
    
    // Done message
    updateStatus("Finished.");
    res.write(`data: [DONE]\n\n`); res.flush();
    res.end();
    return;
  } catch (error) {
    console.log("Error (Generate SSE API):");
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
