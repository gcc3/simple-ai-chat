#!/usr/bin/env node

import { program } from "commander";
import readline from "node:readline";
import command from "./command.js";
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import { initializeStorage } from "./utils/storageUtils.js";
import { initializeSessionMemory } from "./utils/sessionUtils.js";

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

    console.log("simple-ai-chat (cli) v0.1.0");

    // Initialization
    initializeStorage();
    initializeSessionMemory();

    // Command line start
    while (true) {
      const line = (await ask(globalThis.model + "> ")).trim();
      if (!line) continue;

      if (line.toLowerCase() === ":exit") break;
      if (line.startsWith(":")) {
        const commandResult = await command(line, []);
        if (commandResult) {
          console.log(commandResult);
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
  // Clear storage
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
  process.exit(1);
});

program.parseAsync();
