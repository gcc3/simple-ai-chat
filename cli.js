#!/usr/bin/env node

import { program } from "commander";
import readline from "node:readline";
import command from "./command.js";
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import { initializeSettings } from "./utils/settingsUtils.js";
import { initializeSessionMemory } from "./utils/sessionUtils.js";
import { getModel } from "./utils/modelUtils.js";
import { loadConfig } from "./utils/configUtils.js";
import { setTime } from "./utils/sessionUtils.js";
import { Readable } from "stream";
import { OpenAI } from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";
import { getSetting, setSetting } from "./utils/settingsUtils.js";
import { getMcpTools } from "./function.js";
import { getLocalLogs, addLocalLog, resetLocalLogs } from "./utils/offlineUtils.js";
import { PLACEHOLDER, REASONING, QUERYING, GENERATING, SEARCHING, WAITING } from "./constants.js";

// Disable process warnings (node)
process.removeAllListeners('warning');
process.on('warning', () => {});

// Online status
globalThis.isOnline = true;

// Global default model and base URL
globalThis.model = "";
globalThis.baseUrl = "";
globalThis.source = "remote";

// Global server base URL
globalThis.serverBaseUrl = "https://simple-ai.io";

// Simulate a localStorage and sessionStorage in Node.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { LocalStorage } = require("node-localstorage");
globalThis.localStorage = new LocalStorage('./.scratch');
globalThis.sessionStorage = require("node-sessionstorage");

// Monkey-patch the fetch function to use the server's base URL and handle cookies
const cookieJar = new tough.CookieJar();  // Handle cookies
const fetch_ = globalThis.fetch;  // Save the original fetch function
const fetch_c = fetchCookie(fetch_, cookieJar);
globalThis.fetch = async (url, options) => {
  if (url.startsWith("/")) {
    url = globalThis.serverBaseUrl + url;
  }
  return fetch_c(url, options);
};

// Get file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP server
// Start a local MCP server using child_process.spawn
const mcpProcess = spawn('node', [join(__dirname, 'mcp.js')], {
  // detached: true,  // Important: must comment this to avoid black window popup
  stdio: 'ignore',
  windowsHide: true,  // *** This prevents black window ***
});

// Detach the child process from the parent process
mcpProcess.unref();

// M1. Generate SSE
async function generate_sse(model, input, images=[], files=[]) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // MCP functions
  const mcpTools = await getMcpTools(config.functions);
  const mcpToolsString = JSON.stringify(mcpTools);
  console.log("MCP tools: " + mcpToolsString);

  // Build query parameters for SSE GET request
  const params = new URLSearchParams({
    user_input: input,
    images: "",
    files: "",
    time: Date.now().toString(),
    session: config.session,
    model: config.model,
    mem_length: "7",
    functions: config.functions,
    mcp_tools: mcpToolsString,
    role: config.role,
    stores: config.stores,
    node: config.node,
    use_stats: "false",
    use_eval: "false",
    use_location: "false",
    location: "",
    lang: "en-US",
    use_system_role: "true",
  });

  const url = `${globalThis.serverBaseUrl}/api/generate_sse?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[${res.status}] ${await res.text()}`);
  }

  let toolCalls = [];

  // Stream SSE events
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop();

    for (const part of parts) {
      if (!part.startsWith("data:")) continue;

      let dataStr = part.replace(/^data: /, "");

      // Status messages
      if (/^###.+?###/.test(dataStr)) {
        // Handle the callings (tool calls)
        if (dataStr.startsWith("###CALL###")) {
          const toolCall = (JSON.parse(dataStr.replace("###CALL###", "")))[0];
          const toolCallSameIndex = toolCalls.find(t => t.index === toolCall.index);
          if (toolCallSameIndex) {
            // Found same index tool
            toolCallSameIndex.function.arguments += toolCall.function.arguments;
            console.log(toolCall.function.arguments);
          } else {
            // If not found, add the tool
            toolCalls.push(toolCall);
            console.log(JSON.stringify(toolCall));
          }
        }
        continue;
      }

      // DONE message
      if (dataStr === "[DONE]") {
        done = true;

        // Tool calls (function calling)
        if (toolCalls.length > 0) {
          let functions = [];
          toolCalls.map((t) => {
            functions.push("!" + t.function.name + "(" + t.function.arguments + ")");
          });
          const functionInput = functions.join(",");

          // Generate with tool calls (function calling)
          if (input.startsWith("!")) {
            input = input.split("Q=")[1];
          }

          // Reset time
          const timeNow = Date.now();
          setTime(timeNow);
          setSetting("head", timeNow);

          // Call generate with function
          await generate_sse(model, functionInput + " T=" + JSON.stringify(toolCalls) + " Q=" + input, [], []);
          break;
        }

        // Print new line
        printOutput("\n");
        break;
      }

      // Message
      dataStr = dataStr.replace(/###RETURN###/g, "\n");  // Replace all "###RETUREN###" with "\n"
      printOutput(dataStr, true);
    }
  }
}

// M2. Generate message from server, and then call local model engine
async function generate_msg(model, input, images=[], files=[]) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // Input
  console.log("Input (" + config.session + "): " + input);
  if (images.length > 0) console.log("Images: " + images.join(", "));
  if (files.length > 0)  console.log("Files: " + files.join(", "));

  // Output
  let output = "";

  // Use stream
  const useStream = getSetting('useStream') === "true";

  // User
  const user = {
    username: getSetting("user")
  };

  // Model properties
  const is_tool_calls_supported_model = model.is_tool_calls_supported === "1";
  const is_vision_model = model.is_vision === "1";
  const is_audio_model = model.is_audio === "1";
  const is_reasoning_model = model.is_reasoning === "1";
  const is_image_model = model.is_image === "1";

  // Model switch
  const use_vision = images && images.length > 0;

  // Generate messages
  let msg;

  if (globalThis.isOnline) {
    // Online: get remote messages
    console.log("Fetching messages from server.");

    const msgResponse = await fetch("/api/generate_msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        time: config.time,
        user_input: input,
        images: images,
        files: files,
        session: config.session,
        model: config.model,
        mem_length: config.mem_length,
        functions: config.functions,
        role: config.role,
        stores: config.stores,
        node: config.node,
        use_stats: config.use_stats,
        use_eval: config.use_eval,
        use_location: config.use_location,
        location: config.location,
        lang: config.lang,
        use_system_role: config.use_system_role,
      }),
    });

    const msgData = await msgResponse.json();
    if (msgResponse.status !== 200) {
      console.error("Error response from server:", JSON.stringify(msgData));
      printOutput(msgData.error?.message);
      return;
    }

    msg = msgData.result.msg;
  } else {
    // Offline / local Ollama model: get local messages
    console.log("Getting local messages.");

    // History logs
    const localLogs = getLocalLogs();
    let messages = [];
    localLogs.forEach((log) => {
      // Only add messages with the same model
      if (log.model === config.model) {
        messages.push({
          role: "user",
          content: log.input,
        });
        messages.push({
          role: "assistant",
          content: log.output,
        });
      }
    });

    // User input
    messages.push({
      role: "user",
      content: input,
    })
    msg = {
      messages,
    }
  }

  console.log("Messages: " + JSON.stringify(msg.messages));

  const openai = new OpenAI({
    baseURL: config.base_url,
    apiKey: "",  // not necessary for local model, but required for OpenAI API
    dangerouslyAllowBrowser: true,
  });

  // OpenAI chat completion! (for local model)
  const chatCompletion = await openai.chat.completions.create({
    messages: msg.messages,
    model: config.model,
    logit_bias: null,
    n: 1,
    response_format: null,
    seed: null,
    service_tier: null,
    stream: useStream,
    stream_options: null,
    temperature: 1,
    top_p: 1,

    // conditional params
    // function calling only available in non-stream mode
    ...(!useStream && is_tool_calls_supported_model && tools && tools.length > 0 ? { tools: tools, tool_choice: "auto" } : {}),
    ...(is_reasoning_model ? {} : {}),  // TODO, reasoning param not support yet.
    ...(user ? { user: user.username } : {})
  });

  // Record log (chat history)
  const logadd = async (input, output) => {
    if (globalThis.isOnline) {
      // Online: add log to server
      const logaddResponse = await fetch("/api/log/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          output,
          model: config.model,
          session: getSetting("session"),
          images: [],
          time: Date.now(),
        }),
      });

      if (logaddResponse.status !== 200) {
        throw logaddResponse.error || new Error(`Request failed with status ${logaddResponse.status}`);
      }
      return;
    } else {
      // Offline / local Ollama model: add log to local
      // Add to local log
      addLocalLog({
        input: input,
        output: output,
        model: config.model,
        session: getSetting("session"),
        images: [],
        time: Date.now(),
      });
      return;
    }
  }

  // Non-stream mode
  if (!useStream) {
    // Get result
    const choices = chatCompletion.choices;
    if (!choices || choices.length === 0 || choices[0].message === null) {
      console.error("No choice\n");
      printOutput("Silent...");
      return;
    } else {
      // 1. handle reasoning output
      const reasoning = choices[0].message.reasoning;
      if (reasoning) {
        output += "::think::\n" + reasoning + "::think::\n\n";
      }

      // 2. handle message output
      const content = choices[0].message.content;
      if (content) {
        output += content;
      }

      // 3. handle tool calls
      // Not support yet.
    }

    // Add log
    await logadd(input, output);

    // Print output
    printOutput(output.trim() + "\n");
  }

  // Stream mode
  if (useStream) {
    // Convert the response stream into a readable stream
    const stream = Readable.from(chatCompletion);

    let hasReasoning = false;
    let reasoningClosed = false;
    await new Promise((resolve, reject) => {
      // Handle the data event to process each JSON line
      stream.on('data', (chunk) => {
        try {
          // 1. handle reasoning output
          const reasoning = chunk.choices[0].delta.reasoning;
          if (reasoning) {
            hasReasoning = true;
            if (output.trim() === "") {
              output += "::think::\n";
              printOutput("::think::\n", true);
            }
            printOutput(reasoning, true);
          }

          // 2. handle message output
          const content = chunk.choices[0].delta.content;
          if (content) {
            if (hasReasoning && !reasoningClosed) {
              output += "::think::\n\n";
              printOutput("::think::\n\n", true);
              reasoningClosed = true;
            }

            output += content;
            printOutput(content, true);
          }

          // 3. handle tool calls
          // Streaming mode not support tool calls yet. (Ollama)
        } catch (error) {
          console.error('Error parsing JSON line:', error);
          stream.destroy(error); // Destroy the stream on error
          reject(error);
        }
      });

      // Resolve the Promise when the stream ends
      stream.on('end', async () => {
        // Add log
        await logadd(input, output);

        // Add new line
        printOutput("\n");
        resolve();
      });

      // Reject the Promise on error
      stream.on('error', (error) => {
        printOutput(error);
        reject(error);
      });
    });
  }
}

// Function to print output
function printOutput(output, append=false) {
  if (!append) {
    output = output.trimEnd() + "\n";
  }
  process.stdout.write(output);
}

// Get version from package.json
export function getVersion() {
  try {
    const packageJsonPath = join(__dirname, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version || "";
  } catch (error) {
    console.error("Error reading package.json:", error.message);
    return "";
  }
}

// Program start
// In commander.js, the option are converted to camelCase automatically
// Example: --base-url <url> => opts.baseUrl
program
  .name("simple-ai-chat")
  .description("simple-ai-chat (cli) " + getVersion() + "\nFor more information, please visit https://simple-ai.io")
  .version(getVersion(), "-v, --version")
  .option("-d, --debug", "enable verbose logging", false)
  .option("-b, --base-url <url>", "base URL for the server")
  .action(async (opts) => {
    // Verbose
    if (opts.debug) {
      // Enable verbose logging with labeled messages
      console.log = (...args) => {
        printOutput("DEBUG: " + args.join(' '));
      };

      console.error = (...args) => {
        printOutput("ERROR: " + args.join(' '));
      };

      console.warn = (...args) => {
        printOutput("WARNING: " + args.join(' '));
      };
    } else {
      // Disable console output when not in verbose mode
      // Monkey-patch console methods to disable output
      console.log = function() {};
      console.error = function() {};
      console.warn = function() {};
    }

    // Set the base URL
    if (opts.baseUrl) {
      globalThis.serverBaseUrl = opts.baseUrl;
    } else {
      globalThis.serverBaseUrl = "https://simple-ai.io";
    }
    console.log("Server base URL: " + globalThis.serverBaseUrl);

    const ask = async (question) =>
      new Promise((r) => rl.question(question, r));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Initialization
    initializeSettings();
    initializeSessionMemory();

    // System and user configurations
    const getSystemInfo = async () => {
      // System info
      let systemInfo = {
        model: "",
        base_url: "",
        role_content_system: "***",
        welcome_message: "",
        temperature: 1,
        top_p: 1,
        use_node_ai: false,
        use_payment: false,
        use_email: false,
        minimalist: false,
        default_functions: "",
        default_role: "",
        default_stores: "",
        default_node: "",
      };

      // Instead of pinging first, just try system/info and treat failure as offline
      console.log("Fetching system info...");
      try {
        const systemInfoResponse = await fetch('/api/system/info');
        systemInfo = (await systemInfoResponse.json()).result;
      } catch {
        globalThis.isOnline = false;
        globalThis.source = "local";
        console.warn("Offline mode enabled. Some features may not work.");

        // Local online data
        resetLocalLogs();
      }
      console.log("Set is online: " + globalThis.isOnline);
      console.log("System info:", JSON.stringify(systemInfo, null, 2));

      globalThis.rawPlaceholder = PLACEHOLDER;
      globalThis.placeholder = PLACEHOLDER;

      // Set welcome message
      if (systemInfo.welcome_message && !getSetting("user")) {
        printOutput(systemInfo.welcome_message);
      }

      // Set defaults
      if (!getSetting("functions")) setSetting("functions", systemInfo.default_functions);  // default functions
      if (!getSetting("role")) setSetting("role", systemInfo.default_role);    // default role
      if (!getSetting("stores")) setSetting("stores", systemInfo.default_stores);  // default stores
      if (!getSetting("node")) setSetting("node", systemInfo.default_node);    // default node
      if (!getSetting("model")) setSetting("model", systemInfo.model);  // default model
      if (!getSetting("baseUrl")) setSetting("baseUrl", systemInfo.base_url);  // default base url

      // Reset global default model
      globalThis.model = systemInfo.model;
      globalThis.baseUrl = systemInfo.base_url;

      // Model
      const model_ = getSetting("model");
      if (model_) {
        await getModel(model_);
      } else {
        console.warn("No model is set, please use command `:model ls` to list available models and `:model use [name]` to set a model.");
      }
    }
    await getSystemInfo();

    // Command line start
    process.stdout.write(":help for help.\n");
    while (true) {
      const model_ = getSetting("model");
      const input = (await ask(model_ + "> ")).trim();
      if (!input) continue;

      // On submit
      if (input.toLowerCase() === ":exit") break;
      if (input.toLowerCase() === ":clear") {
        process.stdout.write('\x1Bc');
        continue;
      }

      if (input.startsWith(":")) {
        const commandResult = await command(input, []);
        if (commandResult) {
          printOutput(commandResult.trim() + "\n");
        }
        continue;
      }

      // Refresh model
      let model;
      if (model_) {
        model = await getModel(model_);
      } else {
        printOutput("No model is set, please use command \`:model ls\` to list available models and \`:model use [name]\` to set a model.");
        continue;
      }

      // Start generation!
      // Generation mode switch
      // Local mode
      if (model.base_url.includes("localhost")
       || model.base_url.includes("127.0.0.1")) {
        console.log("Start. (local)");
        await generate_msg(model, input, [], []);
        continue;
      }

      // Server model
      if (globalThis.isOnline) {
        if (getSetting('useStream') == "false") {
          console.log("Start. (non-stream)");
          printOutput("Not support yet for non-stream mode.");  // TODO
          continue;
        }

        if (getSetting('useStream') == "true") {
          console.log("Start. (SSE)");
          await generate_sse(model, input, [], []);
          continue;
        }
      } else {
        console.warn("You are offline.");
        printOutput("You are offline.");
        continue;
      }
    }
    rl.close();
  });

// Program exit
function exitProgram() {
  // Something to do before exit
  localStorage.clear();

  // Stop the MCP server if it's running
  if (mcpProcess) {
    mcpProcess.kill('SIGINT');
  }
}
process.on('exit', exitProgram);
process.on('SIGINT', () => {
  exitProgram();
  process.exit(0);
});
process.on('SIGTERM', () => {
  exitProgram();
  process.exit(0);
});
process.on('uncaughtException', err => {
  exitProgram();
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

program.parseAsync();
