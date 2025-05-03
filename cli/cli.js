#!/usr/bin/env node

import { program } from "commander";
import readline from "node:readline";
import command from "../command.js";


// Simulate a localStorage
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { LocalStorage } = require("node-localstorage");
globalThis.localStorage = new LocalStorage('./cli/scratch');


const ENDPOINT = "https://simple-ai.io/api/generate_sse";
const MODEL = "gpt-4.1";

async function callGenerate(prompt, model) {
  // Build query parameters for SSE GET request
  const params = new URLSearchParams({
    user_input: prompt,
    images: "",
    files: "",
    time: Date.now().toString(),
    session: Date.now().toString(),
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

  const url = `${ENDPOINT}?${params.toString()}`;
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

      const dataStr = part.replace(/^data:\s*/, "");

      if (dataStr.startsWith("###STATUS###")) {
        continue;
      }

      if (dataStr === "[DONE]") {
        done = true;
        break;
      }

      try {
        const msg = JSON.parse(dataStr);
        const text = msg.result?.text ?? dataStr;
        process.stdout.write(text);
      } catch {
        process.stdout.write(dataStr);
      }
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
        await callGenerate(promptArr.join(" "), opts.model);
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
    while (true) {
      const line = (await ask(">>> ")).trim();
      if (!line) continue;

      if (line.toLowerCase() === ":exit") break;
      if (line.startsWith(":")) {
        const commandResult = command(line, []);
        if (commandResult) {
          console.log(commandResult);
        }
        continue;
      }

      try {
        // Stream output
        await callGenerate(line, opts.model);
        console.log();
      } catch (e) {
        console.error("Error:", e.message + "\n");
      }
    }
    rl.close();
  });

program.parseAsync();
