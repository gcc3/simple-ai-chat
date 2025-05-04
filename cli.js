#!/usr/bin/env node

import { program } from "commander";
import readline from "node:readline";
import command from "./command.js";
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import { initializeStorage } from "./utils/storageUtils.js";
import { initializeSessionMemory } from "./utils/sessionUtils.js";
import { pingOllamaAPI, listOllamaModels } from "./utils/ollamaUtils.js";
import { loadConfig } from "./utils/configUtils.js";
import { setTime } from "./utils/sessionUtils.js";


// Simulate a localStorage and sessionStorage in Node.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { LocalStorage } = require("node-localstorage");
globalThis.localStorage = new LocalStorage('./.scratch');
globalThis.sessionStorage = require("node-sessionstorage");


globalThis.serverBaseUrl = "https://simple-ai.io";

// Monkey-patch the fetch function to use the BASE_URL and handle cookies
const cookieJar = new tough.CookieJar();  // Handle cookies
const fetch_ = globalThis.fetch;  // Save the original fetch function
const fetch_c = fetchCookie(fetch_, cookieJar);
globalThis.fetch = async (url, options) => {
  if (url.startsWith("/")) {
    url = globalThis.serverBaseUrl + url;
  }
  return fetch_c(url, options);
};

// Monkey-patch the console.log to stop print out in the command line
console.log = function() {};

async function generate_sse(input) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // Build query parameters for SSE GET request
  const params = new URLSearchParams({
    user_input: input,
    images: "",
    files: "",
    time: Date.now().toString(),
    session: sessionStorage.getItem("session"),
    model: globalThis.model,
    mem_length: "7",
    functions: localStorage.getItem("functions"),
    role: sessionStorage.getItem("role"),
    stores: sessionStorage.getItem("stores"),
    node: sessionStorage.getItem("node"),
    use_stats: "false",
    use_eval: "false",
    use_location: "false",
    location: "",
    lang: "en-US",
    use_system_role: "true",
  });

  const url = `${BASE_URL}/api/generate_sse?${params.toString()}`;
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

// Function to print output
function printOutput(output, append=false) {
  process.stdout.write(output);
  if (!append) {
    process.stdout.write("\n");
  }
}

program
  .name("simple-ai-chat")
  .description("Simple AI Chat CLI")
  .version("0.1.0")
  .argument("[prompt...]", "prompt text")
  .option("-m, --model <name>", "model name")
  .option("-v, --verbose", "enable verbose logging")
  .option("-b, --base-url <url>", "base URL for the server")
  .action(async (promptArr, opts) => {
    // Options
    // Enable verbose logging if requested
    if (opts.verbose) {
      console.log = (...args) => {
        printOutput("DEBUG: " + args.join(' ')); 
      };
    }

    // Set the base URL
    if (opts.baseUrl) {
      globalThis.serverBaseUrl = opts.baseUrl;
    } else {
      globalThis.serverBaseUrl = "https://simple-ai.io";
    }

    const ask = async (question) =>
      new Promise((r) => rl.question(question, r));

    if (promptArr.length) {
      try {
        // Stream output directly without extra console.log to avoid 'undefined'
        await generate_sse(promptArr.join(" "), opts.model);
      } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
      }
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    printOutput("simple-ai-chat (cli) v0.1.0\n");
    
    try {
      // Ping the server
      const pingResponse = await fetch('/api/ping');
      const responseText = await pingResponse.text();
      if (responseText !== "Simple AI is alive.") {
      console.log("Ping response: " + responseText);
      printOutput("\`" + globalThis.serverBaseUrl + "` is not response, please check the server status...");
      process.exit(1);
      }
    } catch (error) {
      console.error("Error during server ping:", error.message);
      process.exit(1);
    }

    // Initialization
    initializeStorage();
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
      if (systemInfo.welcome_message && !localStorage.getItem("user")) {
        printOutput(systemInfo.welcome_message);
      }

      // Set defaults
      if (!localStorage.getItem("functions")) localStorage.setItem("functions", systemInfo.default_functions);  // default functions
      if (!sessionStorage.getItem("role")) sessionStorage.setItem("role", systemInfo.default_role);    // default role
      if (!sessionStorage.getItem("stores")) sessionStorage.setItem("stores", systemInfo.default_stores);  // default stores
      if (!sessionStorage.getItem("node")) sessionStorage.setItem("node", systemInfo.default_node);    // default node

      // Set model
      // Auto setup the base URL too
      globalThis.model = systemInfo.model;
      globalThis.baseUrl = systemInfo.base_url;
      if (!sessionStorage.getItem("model")) {
        sessionStorage.setItem("model", systemInfo.model);  // default model
        sessionStorage.setItem("baseUrl", systemInfo.base_url);  // default base url
      } else {
        const modelName = sessionStorage.getItem("model");
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
    while (true) {
      const line = (await ask(globalThis.model + "> ")).trim();
      if (!line) continue;

      if (line.toLowerCase() === ":exit") break;
      if (line.startsWith(":")) {
        const commandResult = await command(line, []);
        if (commandResult) {
          printOutput(commandResult.trim() + "\n");
        }
        continue;
      }

      try {
        // Stream output
        await generate_sse(line);
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
