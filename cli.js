#!/usr/bin/env node

import { program } from "commander";
import readline from "node:readline";
import command from "./command.js";
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import { initializeStorage } from "./utils/storageUtils.js";
import { initializeSessionMemory } from "./utils/sessionUtils.js";
import { pingOllamaAPI, listOllamaModels } from "./utils/ollamaUtils.js";
import { fetchUserInfo, clearUserWebStorage, setUserWebStorage } from "./utils/userUtils.js";

// Simulate a localStorage and sessionStorage in Node.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { LocalStorage } = require("node-localstorage");
globalThis.localStorage = new LocalStorage('./.scratch');
globalThis.sessionStorage = require("node-sessionstorage");


const BASE_URL = "https://simple-ai.io";
const MODEL = "gpt-4.1";

// Monkey-patch the fetch function to use the BASE_URL and handle cookies
const cookieJar = new tough.CookieJar();  // Handle cookies
const fetch_ = globalThis.fetch;  // Save the original fetch function
const fetch_c = fetchCookie(fetch_, cookieJar);
globalThis.fetch = async (url, options) => {
  if (url.startsWith("/")) {
    url = BASE_URL + url;
  }
  return fetch_c(url, options);
};

// Global variables
globalThis.model = MODEL;

async function generate_sse(prompt, model) {
  // Build query parameters for SSE GET request
  const params = new URLSearchParams({
    user_input: prompt,
    images: "",
    files: "",
    time: Date.now().toString(),
    session: sessionStorage.getItem("session"),
    model,
    mem_length: "7",
    functions: "",
    role: "",
    stores: "",
    node: "",
    use_stats: "false",
    use_eval: "false",
    use_location: "false",
    location: "",
    lang: "en-US",
    use_system_role: "false",
  });

  const url = `${BASE_URL}/api/generate_sse?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[${res.status}] ${await res.text()}`);
  }

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

      const dataStr = part.replace(/^data: /, "");

      // Status messages
      if (/^###.+?###/.test(dataStr)) {
        continue;
      }

      // DONE message
      if (dataStr === "[DONE]") {
        done = true;
        break;
      }

      // Message
      process.stdout.write(dataStr);
    }
  }
  process.stdout.write("\n");
}

// Function to print output
function printOutput(output) {
  console.log(output);
}

program
  .name("simple-ai-chat")
  .description("Simple AI Chat CLI")
  .version("0.1.0")
  .argument("[prompt...]", "prompt text")
  .option("-m, --model <name>", "model name", MODEL)
  .action(async (promptArr, opts) => {
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

    // Initialization
    console.log("simple-ai-chat (cli) v0.1.0");
    initializeStorage();
    initializeSessionMemory();

    // System and user configurations
    const getSystemInfo = async () => {
      // User info
      if (localStorage.getItem("user") !== null) {
        console.log("Fetching user info...");
        const user = await fetchUserInfo();
        if (user) {
          console.log("User info - settings: ", JSON.stringify(user.settings, null, 2));
      
          // Refresh local user data
          setUserWebStorage(user);
        } else {
          console.warn("User not found or authentication failed, clearing local user data...");
      
          // Clear local user data
          if (localStorage.getItem("user")) {
            clearUserWebStorage();
      
            // Clear auth cookie
            cookieJar.removeAllCookies();
            console.log("User authentication failed, local user data cleared.");
          }
        }
      } else {
        console.log("User not logged in.");
      }
      
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
    getSystemInfo();

    // Command line start
    while (true) {
      const line = (await ask(globalThis.model + "> ")).trim();
      if (!line) continue;

      if (line.toLowerCase() === ":exit") break;
      if (line.startsWith(":")) {
        const commandResult = await command(line, []);
        if (commandResult) {
          printOutput(commandResult);
        }
        continue;
      }

      try {
        // Stream output
        await generate_sse(line, opts.model);
        console.log();
      } catch (e) {
        console.error("Error:", e.message + "\n");
      }
    }
    rl.close();
  });

// Exit
function exitProgram() {
  // Something to do before exit
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
