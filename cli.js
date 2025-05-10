#!/usr/bin/env node

import { program } from "commander";
import readline from "node:readline";
import command from "./command.js";
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import { initializeSettings } from "./utils/settingsUtils.js";
import { initializeSessionMemory } from "./utils/sessionUtils.js";
import { pingOllamaAPI, listOllamaModels } from "./utils/ollamaUtils.js";
import { loadConfig } from "./utils/configUtils.js";
import { setTime } from "./utils/sessionUtils.js";
import { testSimpleAIServerConnection } from "./utils/cliUtils.js";
import { Readable } from "stream";
import { OpenAI } from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";
import { getSetting } from "./utils/settingsUtils.js";


// Disable process warnings (node)
process.removeAllListeners('warning');
process.on('warning', () => {});


// Simulate a localStorage and sessionStorage in Node.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { LocalStorage } = require("node-localstorage");
globalThis.localStorage = new LocalStorage('./.scratch');
globalThis.sessionStorage = require("node-sessionstorage");


// Monkey-patch the fetch function to use the server's base URL and handle cookies
globalThis.serverBaseUrl = "https://simple-ai.io";
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
async function generate_sse(input, images=[], files=[]) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // Build query parameters for SSE GET request
  const params = new URLSearchParams({
    user_input: input,
    images: "",
    files: "",
    time: Date.now().toString(),
    session: getSetting("session"),
    model: globalThis.model,
    mem_length: "7",
    functions: getSetting("functions"),
    role: getSetting("role"),
    stores: getSetting("stores"),
    node: getSetting("node"),
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
          sessionStorage.setItem("head", timeNow);

          // Call generate with function
          await generate_sse(functionInput + " T=" + JSON.stringify(toolCalls) + " Q=" + input, [], []);
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
async function generate_msg(input, images=[], files=[]) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // Input
  console.log("Input (" + config.session + "): " + input);
  if (images.length > 0) console.log("Images: " + images.join(", "));
  if (files.length > 0)  console.log("Files: " + files.join(", "));

  // Output
  let output = "";

  // Model switch
  const use_vision = images && images.length > 0;
  const model = config.model;

  // Generate messages
  const msgResponse = await fetch("/api/generate_msg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
        user_input: input,
        images: images,
        files: files,
        time: config.time,
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
    throw msgData.error || new Error(`Request failed with status ${msgResponse.status}`);
  }
  const msg = msgData.result.msg;

  // Use stream
  const useStream = getSetting('useStream') === "true";

  // User
  const user = {
    username: getSetting("user")
  }

  const openai = new OpenAI({
    baseURL: config.base_url,
    apiKey: "",  // not necessary for local model, but required for OpenAI API
    dangerouslyAllowBrowser: true,
  });

  // OpenAI chat completion!
  const chatCompletion = await openai.chat.completions.create({
    messages: msg.messages,
    model: model,
    frequency_penalty: 0,
    logit_bias: null,
    n: 1,
    presence_penalty: 0,
    response_format: null,
    seed: null,
    service_tier: null,
    stream: useStream,
    stream_options: null,
    temperature: 1,
    top_p: 1,
    tools: null,  // TODO
    tool_choice: null,  // TODO
    user: user ? user.username : null,
  });

  // Record log (chat history)
  const logadd = async (input, output) => {
    const response1 = await fetch("/api/log/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: getSetting("user") || "",
        input,
        output,
        model: model,
        session: getSetting("session"),
        images: [],
        time: Date.now(),
      }),
    });

    if (response1.status !== 200) {
      throw msgData.error || new Error(`Request failed with status ${response1.status}`);
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
      // 1. handle message output
      const content = choices[0].message.content;
      if (content) {
        output += choices[0].message.content;
      }

      // 2. handle tool calls
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

    await new Promise((resolve, reject) => {
      // Handle the data event to process each JSON line
      stream.on('data', (chunk) => {
        try {
          // 1. handle message output
          const content = chunk.choices[0].delta.content;
          if (content) {
            output += content;
            printOutput(content, true);
          }

          // 2. handle tool calls
          // Not support yet.
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
  process.stdout.write(output);
  if (!append) {
    process.stdout.write("\n");
  }
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

// In commander.js, the option are converted to camelCase automatically
// Example: --base-url <url> => opts.baseUrl
program
  .name("simple-ai-chat")
  .description("simple-ai-chat (cli) " + getVersion() + "\nFor more information, please visit https://simple-ai.io")
  .version(getVersion())
  .option("-v, --verbose", "enable verbose logging", false)
  .option("-b, --base-url <url>", "base URL for the server")
  .action(async (opts) => {
    // Verbose
    if (opts.verbose) {
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

    const ask = async (question) =>
      new Promise((r) => rl.question(question, r));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Test connection to the server
    const serverConnectionSuccessful = await testSimpleAIServerConnection();
    if (!serverConnectionSuccessful) {
      if (opts.baseUrl !== "https://simple-ai.io") {
        printOutput("Please check the server (" + globalThis.serverBaseUrl + ") connection.");
      } else {
        printOutput("The Simple AI server (`" + globalThis.serverBaseUrl + "`) is currently unavailable. You can still connect to your local server using the `--base-url` option.");
      }
      process.exit(1);
    }

    // Initialization
    initializeSettings();
    initializeSessionMemory();

    // System and user configurations
    const getSystemInfo = async () => {
      // System info
      console.log("Fetching system info...");
      const systemInfoResponse = await fetch('/api/system/info');
      const systemInfo = (await systemInfoResponse.json()).result;
      console.log("System info:", JSON.stringify(systemInfo, null, 2));

      if (systemInfo.init_placeholder) {
        globalThis.initPlaceholder = systemInfo.init_placeholder;
        globalThis.rawPlaceholder = systemInfo.init_placeholder;
        globalThis.placeholder = globalThis.initPlaceholder;
      }

      // Set welcome message
      if (systemInfo.welcome_message && !getSetting("user")) {
        printOutput(systemInfo.welcome_message);
      }

      // Set defaults
      if (!getSetting("functions")) localStorage.setItem("functions", systemInfo.default_functions);  // default functions
      if (!getSetting("role")) sessionStorage.setItem("role", systemInfo.default_role);    // default role
      if (!getSetting("stores")) sessionStorage.setItem("stores", systemInfo.default_stores);  // default stores
      if (!getSetting("node")) sessionStorage.setItem("node", systemInfo.default_node);    // default node

      // Set model
      // Auto setup the base URL too
      globalThis.model = systemInfo.model;
      globalThis.baseUrl = systemInfo.base_url;
      if (!getSetting("model")) {
        sessionStorage.setItem("model", systemInfo.model);  // default model
        sessionStorage.setItem("baseUrl", systemInfo.base_url);  // default base url
      } else {
        const modelName = getSetting("model");
        const modelInfoResponse = await fetch('/api/model/' + modelName);
        const modelInfo = (await modelInfoResponse.json()).result;
        if (modelInfo) {
          // Found remote model
          console.log("Set baseUrl: " + modelInfo.base_url);
          sessionStorage.setItem("baseUrl", modelInfo.base_url);
        } else {
          if (await pingOllamaAPI()) {
            const ollamaModels = await listOllamaModels();
            const ollamaModel = ollamaModels.find(o => o.name === modelName);
            if (ollamaModel) {
              // Found ollama model
              console.log("Set baseUrl: " + ollamaModel.base_url);
              sessionStorage.setItem("baseUrl", ollamaModel.base_url);
            } else {
              // Both remote and local model not found, set baseUrl to empty
              console.warn("Model `" + modelName + "` not found, set baseUrl to empty.");
              sessionStorage.setItem("baseUrl", "");
            }
          }
        }
      }
    }
    await getSystemInfo();

    // Command line start
    printOutput(":help for help.");
    while (true) {
      const input = (await ask(globalThis.model + "> ")).trim();
      if (!input) continue;

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

      try {
        // Generation mode switch
        if (globalThis.baseUrl.includes("localhost") 
         || globalThis.baseUrl.includes("127.0.0.1")) {
          // Local model
          console.log("Start. (Local)");
          await generate_msg(input, [], []);
        } else {
          // Server model
          if (getSetting('useStream') == "true") {
            console.log("Start. (SSE)");
            await generate_sse(input, [], []);
          } else {
            // TODO
            printOutput("Not support yet for non-stream mode.");
          }
        }
      } catch (e) {
        console.error("Error:", e.message + "\n");
      }
    }
    rl.close();
  });

// Exit
function exitProgram() {
  // Something to do before exit
  localStorage.clear();
  console.log("Local storage cleared.");
  
  // Stop the MCP server if it's running
  if (mcpProcess) {
    mcpProcess.kill('SIGINT');
  }
  console.log("MCP server stopped.");
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
