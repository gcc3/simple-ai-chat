#!/usr/bin/env node

import { program } from "commander";
import readline from "node:readline";
import exec, { alias } from "./command.js";
import tough from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import { initializeSettings } from "./utils/settings.js";
import { initializeSessionMemory } from "./utils/session.js";
import { getModel } from "./ai/model.js";
import { loadConfig } from "./utils/config.js";
import { Readable } from "stream";
import { OpenAI } from "openai";
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { tmpdir, homedir } from "os";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn, execSync } from "child_process";
import { getSetting, setSetting } from "./utils/settings.js";
import { getLocalLogs, resetLocalLogs } from "./utils/offline.js";
import { getMcpTools } from "./ai/function.js";
import { PLACEHOLDER, REASONING, QUERYING, GENERATING, SEARCHING, WAITING } from "./constants.js";
import { getInput } from "./ai/context/input.js";
import { logadd } from "./utils/client/log.js";
import { exec_f } from "./ai/function.client.js";
import { pingOllamaAPI } from "./ai/ollama.js";
import { getSystemInfo } from "./utils/client/system.js"
import { pingMcpServer } from "./ai/mcp.js";
import { refreshLocalUser } from "./utils/user.js";

// Disable process warnings (node)
process.removeAllListeners('warning');
process.on('warning', () => { });

// Mode
// "interactive" or "bash-command"
globalThis.mode = "interactive";

// Online status
globalThis.isOnline = true;

// Ollama status
globalThis.isOllamaAvailable = false;
globalThis.ollamaBaseUrl = "http://localhost:11434";

// MCP server
globalThis.isMCPServerAvailable = false;
globalThis.mcpServerBaseUrl = "http://localhost:11318";

// Global placeholder
globalThis.rawPlaceholder = PLACEHOLDER;

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
globalThis.localStorage = new LocalStorage(join(homedir(), '.simple', '.scratch'));
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

// ---- Generation Methods -------------------------------------------
// M1. Generate SSE
async function generate_sse(model, input) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // MCP functions
  const mcpTools = await getMcpTools(config.functions);
  const mcpToolsString = JSON.stringify(mcpTools);
  console.log("MCP tools: " + mcpToolsString);

  // Build query parameters for SSE GET request
  const params = new URLSearchParams({
    user_input: input.text,
    time: Date.now().toString(),
    session: config.session,
    model: model.name,
    mem_length: "7",
    functions: config.functions,
    mcp_tools: mcpToolsString,
    role: config.role,
    stores: config.stores,
    node: config.node,
    use_location: "false",
    location: "",
    lang: config.lang,
    use_system_role: "true",
  });

  // Previously used generate_sse
  const url = `${globalThis.serverBaseUrl}/api/generate/short?${params.toString()}`;
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

      // Newline
      dataStr = dataStr.replace(/###RETURN###/g, "\n");

      // Status messages
      if (/^###.+?###/.test(dataStr)) {
        // Handle tool calls
        if (dataStr.startsWith("###CALL###")) {
          const toolCall = (JSON.parse(dataStr.replace("###CALL###", "")))[0];
          const toolCallSameIndex = toolCalls.find(t => t.index === toolCall.index);
          if (toolCallSameIndex) {
            toolCallSameIndex.function.arguments += toolCall.function.arguments;
            console.log(toolCall.function.arguments);
          } else {
            toolCalls.push(toolCall);
            console.log(JSON.stringify(toolCall));
          }
        }

        // Handle error
        if (dataStr.startsWith("###ERR###")) {
          printOutput(dataStr.replace("###ERR###", ""), true);
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

          let q = "";
          if (input.is_function) {
            q = input.text.split("Q=")[1];
          }

          const timeNow = Date.now();
          setSetting("head", timeNow);

          const newInput = getInput(functionInput + " T=" + JSON.stringify(toolCalls) + " Q=" + q);
          await generate_sse(model, newInput);
          break;
        }

        printOutput("\n");
        break;
      }

      // Message
      printOutput(dataStr, true);
    }
  }
}

// M2. Generate message from server, and then call local model engine
async function generate_msg(model, input) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // Input
  console.log("Input (" + config.session + "):\n" + input.text);

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
  const use_vision = input.has_image;

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
        user_input: input.text,
        images: input.image_urls,
        files: input.file_urls,
        session: config.session,
        model: model.name,
        mem_length: config.mem_length,
        functions: config.functions,
        role: config.role,
        stores: config.stores,
        node: config.node,
        use_stats: config.use_stats,
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
      if (log.model === model.name) {
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
      content: input.text,
    })
    msg = {
      messages,
    }
  }

  console.log("Messages: " + JSON.stringify(msg.messages));

  // Local OpenAI client
  const openai = new OpenAI({
    baseURL: model.base_url,
    apiKey: "",  // not necessary for local model, but required for OpenAI API
    dangerouslyAllowBrowser: true,
  });

  // OpenAI chat completion! (for local model)
  const chatCompletion = await openai.chat.completions.create({
    messages: msg.messages,
    model: model.name,
    logit_bias: null,
    n: 1,
    response_format: null,
    seed: null,
    service_tier: null,
    stream: useStream,
    stream_options: null,
    temperature: 1,

    // conditional params
    // function calling only available in non-stream mode
    ...(!useStream && is_tool_calls_supported_model && tools && tools.length > 0 ? { tools: tools, tool_choice: "auto" } : {}),
    ...(is_reasoning_model && !useStream && is_tool_calls_supported_model && tools && tools.length > 0 ? { reasoning_effort: "none" } : {}),
    ...(user ? { user: user.username } : {})
  });

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
    await logadd(model, input.text, output);

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
        await logadd(model, input.text, output);

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

// M3. Generate Bash Command
async function generate_bash_command(model, input) {
  // Config (input)
  const config = loadConfig();
  console.log("Config: " + JSON.stringify(config));

  // Collect shell context for bash command generation
  let pwd = "", whoami = "", lsla = "", uname = "", shell = "";
  try { pwd = execSync('pwd', { encoding: 'utf8' }).trim(); } catch (_) {}
  try { whoami = execSync('whoami', { encoding: 'utf8' }).trim(); } catch (_) {}
  try { lsla = execSync('ls -la', { encoding: 'utf8' }).trim().split('\n').slice(0, 100).join('\n'); } catch (_) {}
  try { uname = execSync('uname -a', { encoding: 'utf8' }).trim(); } catch (_) {}
  try { shell = execSync('echo $SHELL', { encoding: 'utf8' }).trim(); } catch (_) {}
  const environment_context = `\n\npwd:\n${pwd}\n\nwhoami:\n${whoami}\n\nuname:\n${uname}\n\nshell:\n${shell}\n\nls -la:\n${lsla}`;

  // Build query parameters for SSE GET request
  const params = new URLSearchParams({
    user_input: input.text,
    time: Date.now().toString(),
    session: config.session,
    model: model.name,
    environment_context,
  });

  const url = `${globalThis.serverBaseUrl}/api/generate/bash-command?${params.toString()}`;
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

      let dataStr = part.replace(/^data: /, "");

      // Newline
      dataStr = dataStr.replace(/###RETURN###/g, "\n");  // Replace all "###RETURN###" with "\n"

      // Status messages
      if (/^###.+?###/.test(dataStr)) {
        // Handle error
        if (dataStr.startsWith("###ERR###")) {
          printOutput(dataStr.replace("###ERR###", ""), true);

          // Exit
          printOutput("\n");
          process.exit(1);
        }

        continue;
      }

      // DONE message
      if (dataStr === "[DONE]") {
        done = true;

        // Print new line
        printOutput("\n");
        break;
      }

      // Message
      printOutput(dataStr, true);
    }
  }
}

// ---- CLI Program --------------------------------------------------
// Utils
// Function to print output
function printOutput(output, append = false) {
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
  .description("simple-ai chat (cli) " + getVersion() + "\nFor more information, please visit https://simple-ai.io")
  .version(getVersion(), "-v, --version")
  .argument("[instruct...]", "instruct to send to AI (bash-command mode)")
  .option("-d, --debug", "enable verbose logging", false)
  .option("-b, --base-url <url>", "base URL for the server")
  .action(async (instruct, opts) => {
    // Mode
    if (instruct && instruct.length > 0) {
      globalThis.mode = "bash-command";

      // Join variadic words into a single string
      if (Array.isArray(instruct)) {
        instruct = instruct.join(" ") || "";
      }
    } else {
      globalThis.mode = "interactive";
    }

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
      console.log = function () { };
      console.error = function () { };
      console.warn = function () { };
    }

    // Set the base URL
    if (opts.baseUrl) {
      globalThis.serverBaseUrl = opts.baseUrl;
      console.log("Set server base URL: " + globalThis.serverBaseUrl);
    }

    const ask = async (question) =>
      new Promise((r) => {
        const originalWrite = rl._writeToOutput.bind(rl);
        rl._writeToOutput = (str) => {
          // rl.line is updated before _writeToOutput is called, so it reflects
          // the current buffer including the character just typed.
          const line = rl.line || "";

          // Patterns that have a password field — capture (prefix, password-so-far)
          const passwordPatterns = [
            /^(:login\s+\S+\s+)(\S*)$/,           // :login <user> <password>
            /^(:user\s+set\s+pass\s+)(\S*)$/,      // :user set pass <password>
            /^(:user\s+add\s+\S+\s+\S+\s+)(\S*)$/, // :user add <user> <email> <password>
            /^(:user\s+join\s+\S+\s+)(\S*)$/,      // :user join <group> <password>
          ];

          const passwordMatch = passwordPatterns.reduce((found, re) => found || line.match(re), null);

          // `passMask` settting is true → mask password input with "*"
          if (passwordMatch && getSetting("passMask") === "true") {
            const passwordLen = passwordMatch[2].length;
            if (str.length === 1 && str.charCodeAt(0) > 32) {
              // Single printable non-space character being echoed → mask it
              rl.output.write("*");
              return;
            }
            // Redraw (backspace / cursor move): str contains prompt + line.
            // Replace the plaintext password portion with stars.
            const maskedLine = passwordMatch[1] + "*".repeat(passwordLen);
            const maskedStr = str.replace(line, maskedLine);
            rl.output.write(maskedStr);
            return;
          }

          rl.output.write(str);
        };
        rl.question(question, (answer) => {
          rl._writeToOutput = originalWrite;
          r(answer);
        });
      });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Initialization
    initializeSettings();
    initializeSessionMemory();

    // Load cookie BEFORE fetching system data so requests carry auth.
    // Awaited via a Promise wrapper because tough-cookie / store ops are callback-based.
    const cookieFile = join(homedir(), ".simple", "cookie");
    if (existsSync(cookieFile)) {
      try {
        const cookieData = JSON.parse(readFileSync(cookieFile, "utf-8"));
        await new Promise((resolve) => {
          tough.CookieJar.deserialize(cookieData, (err, tempJar) => {
            if (err) {
              console.error("Error deserializing cookies:", err);
              return resolve();
            }
            tempJar.store.getAllCookies((err, cookies) => {
              if (err || !cookies || cookies.length === 0) return resolve();
              let pending = cookies.length;
              cookies.forEach((cookie) => {
                cookieJar.store.putCookie(cookie, () => {
                  if (--pending === 0) resolve();
                });
              });
            });
          });
        });
        console.log("Cookies loaded from file: " + cookieFile);
      } catch (error) {
        console.error("Error reading cookie file:", error);
      }
    }

    // Fetch system data (system info, user info, model etc.)
    const fetchSystemData = async () => {
      // System info
      const systemInfo = await getSystemInfo();
      console.log("System info:", JSON.stringify(systemInfo, null, 2));

      try {
        await fetch('/api/ping');
      } catch {
        globalThis.isOnline = false;
        globalThis.source = "local";
        console.warn("Offline mode enabled. Some features may not work.");

        // Local online data
        resetLocalLogs();
      }
      console.log("Set is online: " + globalThis.isOnline);

      // Ollama status
      globalThis.isOllamaAvailable = await pingOllamaAPI();

      // MCP server status
      globalThis.isMCPServerAvailable = await pingMcpServer();

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
    await fetchSystemData();

    // Re-hydrate local user from server using the cookie we just loaded.
    // If the cookie is valid the server returns the user and we restore the
    // `user` setting; if not, local user is cleared.
    if (globalThis.isOnline) {
      try {
        await refreshLocalUser();
      } catch (error) {
        console.error("Error refreshing local user:", error);
      }
    }

    // Bash-command mode
    if (globalThis.mode === "bash-command") {
      const input = getInput(instruct);
      if (input.error) {
        printOutput(input.error + "\n");
        process.exit(1);
      }

      // Generate bash command
      const model_ = getSetting("model");
      if (!model_) {
        printOutput("No model is set. Use `:model use [name]` to set a model.");
        process.exit(1);
      }
      const model = await getModel(model_);

      // Capture generated output
      let capturedOutput = "";
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = (data) => {
        capturedOutput += data;
        return originalWrite(data);
      };

      if (model.base_url.includes("localhost") || model.base_url.includes("127.0.0.1")) {
        await generate_msg(model, input);
      } else if (globalThis.isOnline) {
        await generate_bash_command(model, input);
      } else {
        process.stdout.write = originalWrite;
        printOutput("You are offline.");
        process.exit(1);
      }

      process.stdout.write = originalWrite;

      // Execute the generated bash command
      const command = capturedOutput.trim();
      if (command) {
        // Prompt user to confirm execution
        const confirmed = await new Promise((resolve) => {
          process.stdout.write("Press ENTER to execute or ESC to cancel...");
          
          const stdin = process.stdin;
          stdin.setRawMode(true);
          stdin.resume();
          stdin.setEncoding('utf8');
          
          const onData = (char) => {
            if (char === '\u001b') {  // ESC key
              stdin.setRawMode(false);
              stdin.pause();
              stdin.removeListener('data', onData);
              process.stdout.write("\nCancelled.\n");
              resolve(false);
            } else if (char === '\r' || char === '\n') {  // ENTER key
              stdin.setRawMode(false);
              stdin.pause();
              stdin.removeListener('data', onData);
              resolve(true);
            }
          };
          
          stdin.on('data', onData);
        });
        
        if (confirmed) {
          try {
            execSync(command, { stdio: "inherit" });
          } catch (err) {
            process.exit(err.status || 1);
          }
        }
      }
      
      process.exit(0);
    }

    // Command line start or on submit
    process.stdout.write('\x1Bc');  // clear
    process.stdout.write(":help for help.\n");
    while (true) {
      const model_ = getSetting("model");

      // Start
      let user_raw_input = (await ask("\n" + model_ + "> ")).trim();
      if (!user_raw_input) continue;

      // Input
      let input = getInput(user_raw_input);
      if (input.error) {
        printOutput(input.error + "\n");
        continue;
      }

      // Command alias support
      input.command = alias(input.command, false);

      // Pre-process input
      // [:vi] — open editor to compose input
      if (input.is_command && input.command === "vi" && input.arguments_.length === 0) {
        const editor = process.env.VISUAL || process.env.EDITOR || input.command;  // $VISUAL > $EDITOR > "vi"

        // Create a temporary file
        const tmpFile = join(tmpdir(), `sai-vi-${Date.now()}.txt`);
        writeFileSync(tmpFile, "");  // Create an empty temp file
        rl.pause();

        const viProcess = spawn(editor, [tmpFile], { stdio: "inherit" });
        let spawnError = null;
        viProcess.on("error", (err) => { spawnError = err; });
        await new Promise((resolve) => viProcess.on("close", resolve));
        rl.resume();
        if (spawnError) {
          if (spawnError.code === "ENOENT") {
            printOutput(`Editor "${editor}" not found. Please install it or set $VISUAL/$EDITOR.\n`);
          } else {
            printOutput(`Editor error: ${spawnError.message}\n`);
          }
          try { unlinkSync(tmpFile); } catch { /* ignore */ }
          continue;
        }
        try {
          user_raw_input = readFileSync(tmpFile, "utf8").trim();
        } catch {
          continue;
        } finally {
          try { unlinkSync(tmpFile); } catch { /* ignore */ }
        }

        // Re-create the input
        input = getInput(user_raw_input);
        if (input.error) {
          printOutput(input.error + "\n");
          continue;
        }

        // Print the edited input
        if (user_raw_input) {
          const quoted = user_raw_input.split("\n").map(line => `> ${line}`).join("\n");
          printOutput(`${quoted}\n`);
        }
      }

      // Command Input
      if (input.is_command) {
        if (input.command === "exit") break;
        if (input.command === "clear") {
          process.stdout.write('\x1Bc');
          continue;
        }

        // Execute command
        const result = await exec(input.text_raw, []);
        if (result) {
          printOutput(result.trim() + "\n");
        }

        // Store cookie
        if (input.command === "login") {
          // Store login cookie into ~/.simple/cookie for future use
          const cookieDir = join(homedir(), ".simple");
          if (!existsSync(cookieDir)) mkdirSync(cookieDir, { recursive: true });
          const cookieFile = join(cookieDir, "cookie");
          if (cookieJar && cookieJar.serialize) {
            cookieJar.serialize((err, serialized) => {
              if (err) {
                console.error("Error serializing cookies:", err);
                return;
              }
              writeFileSync(cookieFile, JSON.stringify(serialized));
              console.log("Cookies saved to: " + cookieFile);
            });
          }
        }

        continue;
      }

      // Function Input
      if (input.is_function) {
        const results = await exec_f(input.text);
        console.log("Function Results: " + JSON.stringify(results));
        if (results.length === 1) {
          const result = results[0];
          printOutput(result.success ? result.message : result.error);
        } else {
          for (let i = 0; i < results.length; i++) {
            const result = results[i];

            // Print the output
            let resultText = "!" + result.function + "\n";
            resultText += result.success ? result.message : result.error;
            if (elOutputRef.current.innerHTML !== "") resultText = "\n\n" + resultText;
            printOutput(resultText, true);

            // Handle function event
            // TODO
          }
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
        await generate_msg(model, input);
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
          await generate_sse(model, input);
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
  // Note: do NOT clear localStorage here — settings like `user` are persisted
  // to disk via node-localstorage and must survive across sessions so login
  // state (paired with ~/.simple/cookie) is remembered.

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
