import { isCommandMusked } from "./utils/passwordUtils.js";
import { getSetting, setSetting } from "./utils/settingsUtils.js";
import help from "./commands/help.js";
import stats from "./commands/stats.js";
import eval_ from "./commands/eval.js";
import stream from "./commands/stream.js";
import log from "./commands/log.js";
import info from "./commands/info.js";
import ls from "./commands/ls.js";
import session from "./commands/session.js";
import role from "./commands/role.js";
import clear from "./commands/clear.js";
import reset from "./commands/reset.js";
import speak from "./commands/speak.js";
import lang from "./commands/lang.js";
import stop from "./commands/stop.js";
import function_ from "./commands/function.js";
import location from "./commands/location.js";
import voice from "./commands/voice.js";
import system from "./commands/system.js";
import fullscreen from "./commands/fullscreen.js";
import theme from "./commands/theme.js";
import user from "./commands/user.js";
import login from "./commands/login.js";
import logout from "./commands/logout.js";
import store from "./commands/store.js";
import search from "./commands/search.js";
import node from "./commands/node.js";
import set from "./commands/set.js";
import generate from "./commands/generate.js";
import invite from "./commands/invite.js";
import attach from "./commands/attach.js";
import use from "./commands/use.js";
import split from "./commands/split.js";
import unuse from "./commands/unuse.js";
import model from "./commands/model.js";


export default function commands(input, files) {
  let command = input;
  let args = [];

  // Push to command history
  pushCommandHistory(command);

  if (input.indexOf(' ') !== -1) {
    // Has arguments
    command = input.substring(0, input.indexOf(' '));

    args = extractArgs(input.substring(input.indexOf(' ') + 1));
    if (args.length > 0) {
      console.log("Command Arguments: " + (!isCommandMusked(command) ? args : "(masked)"));
    }
  }
  
  // Use strict equality for command matching to avoid partial matches
  if (command === ":help") return help(args);
  if (command === ":stats") return stats(args);
  if (command === ":eval") return eval_(args);
  if (command === ":stream") return stream(args);
  if (command === ":login") return login(args);
  if (command === ":logout") return logout(args);
  if (command === ":log") return log(args);
  if (command === ":info") return info(args);
  if (command === ":ls") return ls(args);
  if (command === ":session") return session(args);
  if (command === ":role") return role(args);
  if (command === ":clear") return clear(args);
  if (command === ":reset") return reset(args);
  if (command === ":speak") return speak(args);
  if (command === ":lang") return lang(args);
  if (command === ":stop") return stop(args);
  if (command === ":function") return function_(args);
  if (command === ":location") return location(args);
  if (command === ":voice") return voice(args);
  if (command === ":system") return system(args);
  if (command === ":fullscreen") return fullscreen(args);
  if (command === ":theme") return theme(args);
  if (command === ":user") return user(args);
  if (command === ":store") return store(args, files);
  if (command === ":search") return search(args);
  if (command === ":node") return node(args);
  if (command === ":set") return set(args);
  if (command === ":generate") return generate(args);
  if (command === ":invite") return invite(args);
  if (command === ":attach") return attach(args);
  if (command === ":use") return use(args);
  if (command === ":split") return split(args);
  if (command === ":unuse") return unuse(args);
  if (command === ":model") return model(args);
  return "Unknown command.";
}

function extractArgs(input) {
  let regex = /([^\s,"]+|"[^"]*")/g;
  let match;
  let matchList = [];
  while ((match = regex.exec(input)) !== null) {
    if (match[1] != null) {
        // Add double-quoted string without the quotes
        matchList.push(match[1]);
    } else if (match[2] != null) {
        // Add single-quoted string without the quotes
        matchList.push(match[2]);
    } else {
        // Add unquoted word
        matchList.push(match[0]);
    }
  }
  return matchList;
}

export function getCommands() {
  const commands = [
    { id: "commands-general", title: "General", annotation: "", command: ":help [command?]", options: "", short_description: "Show command help.", description: "Show command help. The command should be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":stop", options: "", short_description: "Stop generating. (⌃c)", description: "Stop generating. Same as in a shell, use control + c can stop executing." },
    { id: "", title: "", annotation: "", command: ":clear", options: "", short_description: "Clear output. (⌃r)", description: "Clear output. This will only reset output to empty." },
    { id: "", title: "", annotation: "", command: ":reset", options: "", short_description: "Reset memory, uses. (⇧⌃r)", description: "Reset session with memory. It will also reset role, store and node." },
    { id: "", title: "", annotation: "", command: ":fullscreen [off?]", options: "", short_description: "Fullscreen default mode (F11).", description: "Fullscreen default mode, or turn it off" },
    { id: "", title: "", annotation: "", command: ":fullscreen split", options: "", short_description: "Fullscreen split mode (⌃|).", description: "Use fullscreen split mode, to split screen left and right. Or use off to turn fullscreen off. Fullscreen split mode will makes easier to input data and review output, especially when dealing with lengthy responses." },
    { id: "", title: "", annotation: "", command: ":split", options: "", short_description: "Short for `:fullscreen split`.", description: "Same as command `:fullscreen split` but shorter. Use fullscreen split mode, to split screen left and right. Or use off to turn fullscreen off. Fullscreen split mode will makes easier to input data and review output, especially when dealing with lengthy responses." },
    { id: "", title: "", annotation: "", command: ":theme [light|dark|terminal]", options: "", short_description: "Change color theme.", description: "" },
    { id: "", title: "", annotation: "", command: ":lang [ls|list]", options: "", short_description: "List all languages.", description: "List all available language codes." },
    { id: "", title: "", annotation: "", command: ":lang use [language_code]", options: "", short_description: "Set language.", description: "Set language. This language settings is both for page UI, voice and the text generation. The language code should include country code too, example: `fr-FR`." },
    { id: "", title: "", annotation: "", command: ":lang reset", options: "", short_description: "Reset language.", description: "Reset language to empty." },
    { id: "", title: "", annotation: "", command: ":function [ls|list]", options: "", short_description: "List all supported functions.", description: "To directly call a function, use `!function_name(parameters)`" },
    { id: "", title: "", annotation: "", command: ":function [name]", options: "", short_description: "Show function detail.", description: "" },
    { id: "", title: "", annotation: "", command: ":function [use|unuse] [name]", options: "", short_description: "Use or unuse a function.", description: "Use or unuse a function for function calling." },
    { id: "", title: "", annotation: "", command: ":location [on|off]", options: "", short_description: "Switch on/off location service.", description: "When you turn on the location service, the AI can provide answers based on your location." },
    { id: "", title: "", annotation: "", command: ":stream [on|off]", options: "", short_description: "Switch on/off stream mode.", description: "When the stream is off, the text will be displayed once the answer is fully generated." },
    { id: "", title: "", annotation: "", command: ":set [key] [value]", options: "", short_description: "Set local configurations.", description: "Set session configurations and local configurations, the key must be one of session storage or local storage key, case-insensitive. For values include space(s) must be enclosed in double quotes. To check the available keys, use command `:info`. Example: `set memlength 0`, this can set the memory to 0 and save a lots of tokens. If you want to use function calling don't set to 0, 1 call = 1 mem, and response also increase 1 mem." },
    { id: "", title: "", annotation: "", command: ":use [name]", options: "", short_description: "Use a function, node, store or role.", description: "Use a function, node, store or role. Same as `:function use`, `:role use`, `:store use` or `:node use`, just for reducing some typing. If a function, node, store or role has same name, will first try to find function, then node, then store, then role." },
    { id: "", title: "", annotation: "", command: ":unuse [name]", options: "", short_description: "Unuse a function, node, store or role.", description: "Unuse a function, node, store or role. Same as `:function unuse`, `:role reset`, `:store unuse` or `:node reset`, just for reducing some typing. If a function, node, store or role has same name, will first try to find function, then node, then store, then role." },
    { id: "commands-session", title: "Sessions & Logs", annotation: "", command: ":log", options: "", short_description: "Show logs for current session.", description: "" },
    { id: "", title: "", annotation: "", command: ":ls", options: "", short_description: "List sessions, same as `:session ls`.", description: "" },
    { id: "", title: "", annotation: "", command: ":attach [session_id]", options: "", short_description: "Attach to a session.", description: "Attach to a session, same as :session attach [session_id]. When attached to a session, you can use left/right arraw key or J/K key to navigate between session logs." },
    { id: "", title: "", annotation: "", command: ":session", options: "", short_description: "Show session info.", description: "Check current session infromation, like parent session ID, created by." },
    { id: "", title: "", annotation: "", command: ":session [ls|list]", options: "", short_description: "List sessions.", description: "List sessions with short user input." },
    { id: "", title: "", annotation: "", command: ":session attach [session_id]", options: "", short_description: "Attach to a session.", description: "Attach to a session. When attached to a session, you can use left/right arraw key or J/K key to navigate between session logs." },
    { id: "commands-model", title: "Models", annotation: "", command: ":model [name?]", options: "", short_description: "Show model detail.", description: "The model name is optional. If no model is input, it will return the current model details, the prompt must be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":model [ls|list]", options: "", short_description: "List available models.", description: "Include user models and shared models." },
    { id: "", title: "", annotation: "", command: ":model [use|unuse] [name]", options: "", short_description: "Use/unuse a model.", description: "" },
    { id: "", title: "", annotation: "", command: ":model reset", options: "", short_description: "Reset model to system default model.", description: "" },
    { id: "commands-eval", title: "Stats & Self-evaluation", annotation: "", command: ":stats [on|off]", options: "", short_description: "Show stats info.", description: "A stats information will show below." },
    { id: "", title: "", annotation: "", command: ":eval [on|off]", options: "", short_description: "Enable the self evaluation score.", description: "" },
    { id: "commands-speak", title: "Speak", annotation: "", command: ":speak [on|off]", options: "", short_description: "Switch on/off auto speak.", description: "Auto read the result with system TTS voice." },
    { id: "", title: "", annotation: "", command: ":voice [ls|list]", options: "", short_description: "List all supported voices.", description: "List all system supported TTS voices." },
    { id: "", title: "", annotation: "", command: ":voice use [voice_name]", options: "", short_description: "Set voice.", description: "To use a voice by inputting its name, the voice_name must be enclosed in double quotes. For example, \"Samantha\" or \"John\"." },
    { id: "commands-role", title: "Roles", annotation: "For user's custom role command refer `:user role` commands.", command: ":role [name?]", options: "", short_description: "Show role prompt.", description: "" },
    { id: "", title: "", annotation: "", command: ":role use [role_name]", options: "", short_description: "Use a role.", description: "" },
    { id: "", title: "", annotation: "", command: ":role [ls|list]", options: "", short_description: "List available roles.", description: "Roles include user custom roles and system roles." },
    { id: "", title: "", annotation: "", command: ":role reset", options: "", short_description: "Reset role to empty.", description: "Clear the current role." },
    { id: "", title: "", annotation: "", command: ":role [add|set] [role_name] [prompt]", options: "", short_description: "Add or set a role.", description: "" },
    { id: "", title: "", annotation: "", command: ":role [del|delete] [role_name]", options: "", short_description: "Delete a role.", description: "" },
    { id: "commands-store", title: "Data Store", annotation: "", command: ":search [text]", options: "", short_description: "Search from data store(s).", description: "Search to get inforamtion from the current data store with nature language." },
    { id: "", title: "", annotation: "", command: ":store [name?]", options: "", short_description: "Show data store detail.", description: "Show detail of a data store. The store name is optional. If no name is input, it will return the current data store details." },
    { id: "", title: "", annotation: "", command: ":store [ls|list]", options: "", short_description: "List available data stores.", description: "Include the user data stores and shared data stores." },
    { id: "", title: "", annotation: "", command: ":store [use|unuse] [name]", options: "", short_description: "Use/unuse a data store.", description: "" },
    { id: "", title: "", annotation: "", command: ":store reset", options: "", short_description: "Reset data store to empty.", description: "Reset the current data store to empty. This will not reset data store data, to reset data use `:store data reset`" },
    { id: "", title: "", annotation: "", command: ":store add [engine] [name]", options: "", short_description: "Create a data store.", description: "Create a database with engine and store name. Supported engines: \"file\" \"mysql\". Engine and store name must be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":store init [name?]", options: "", short_description: "Initialize a data store.", description: "Initialize the current data store. Store name (optional) should be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":store set owner [owner]", options: "", short_description: "Change store owner.", description: "" },
    { id: "", title: "", annotation: "", command: ":store set [key] [value]", options: "", short_description: "Setup a store settings.", description: "Adjust the values of data store settings. The value must be enclosed in double quates." },
    { id: "", title: "", annotation: "", command: ":store data upload [file]", options: "", short_description: "Upload file for store.", description: "" },
    { id: "", title: "", annotation: "", command: ":store data reset [name?]", options: "", short_description: "Reset store data.", description: "" },
    { id: "", title: "", annotation: "", command: ":store [del|delete] [name]", options: "", short_description: "Delete a store.", description: "" },
    { id: "commands-node", title: "Node (Node AI)", annotation: "", command: ":generate [prompt]", options: "", short_description: "Generate from node.", description: "Generate from the current node (Node AI)." },
    { id: "", title: "", annotation: "", command: ":node [name?]", options: "", short_description: "Show node detail.", description: "The node name is optional. If no name is input, it will return the current node details, the prompt must be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":node [ls|list]", options: "", short_description: "List available nodes.", description: "Include the user data nodes and shared nodes." },
    { id: "", title: "", annotation: "", command: ":node [use|unuse] [name]", options: "", short_description: "Use/unuse a node.", description: "" },
    { id: "", title: "", annotation: "", command: ":node reset", options: "", short_description: "Reset node to empty.", description: "Reset the current node to empty." },
    { id: "", title: "", annotation: "", command: ":node add [name]", options: "", short_description: "Create a node.", description: "Create a node. Node name can only contain letters, numbers, underscores and hyphens and less than or equals 32 charactors." },
    { id: "", title: "", annotation: "", command: ":node [del|delete] [name]", options: "", short_description: "Delete a node.", description: "" },
    { id: "", title: "", annotation: "", command: ":node set owner [owner]", options: "", short_description: "Change node owner.", description: "" },
    { id: "", title: "", annotation: "", command: ":node set [key] [value]", options: "", short_description: "Setup a node settings.", description: "Users can adjust the values of node settings." },
    { id: "commands-user", title: "User", annotation: "", command: ":user add [username] [email] [password?]", options: "", short_description: "Create a user.", description: "This command will create a user. After creating, an email verification is required. Setting a password is optional. If you choose not to set a password, the system will generate one for you and send it to your email." },
    { id: "", title: "", annotation: "", command: ":user [info?]", options: "", short_description: "Get logged-in user info and settings.", description: "Get logged-in user info and settings." },
    { id: "", title: "", annotation: "", command: ":user set pass [value]", options: "", short_description: "Change password.", description: "After changing the password, the user will receive an email notification." },
    { id: "", title: "", annotation: "", command: ":user set email [value]", options: "", short_description: "Change email address.", description: "After changing their email address, the user will receive a verification email. Email verification is mandatory." },
    { id: "", title: "", annotation: "", command: ":user set [key] [value]", options: "", short_description: "Change user settings.", description: "Users can adjust their settings, and any values must be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":user reset [key]", options: "", short_description: "Reset a user's setting to default.", description: "" },
    { id: "", title: "", annotation: "", command: ":user reset settings", options: "", short_description: "Reset user's settings to default.", description: "" },
    { id: "", title: "", annotation: "", command: ":user reset pass [username] [email]", options: "", short_description: "Recover password.", description: "A recovery email containing a generated password will be sent to the user. If you forgot your password and cannot login your account, please use this command to recover your password." },
    { id: "", title: "", annotation: "", command: ":user join [group] [password]", options: "", short_description: "Join a group.", description: "Join a group. When creating a user, a group with the same name will also be created, and owned by this user. A user can join any group to access shared data. The password is generated and set in the user's settings." },
    { id: "", title: "", annotation: "", command: ":user leave [group]", options: "", short_description: "Leave a group.", description: "" },
    { id: "", title: "", annotation: "", command: ":user [del|delete] [username]", options: "", short_description: "Delete user with data.", description: "" },
    { id: "", title: "", annotation: "", command: ":invite [email]", options: "", short_description: "Send invitation email.", description: "Send an invitation email (with a invitation code) to your friends or family to register as users, and both of you will get a reward." },
    { id: "", title: "", annotation: "", command: ":login [username] [password]", options: "[-s|--save]", short_description: "Login user.", description: "Log in user and load configurations from user settings. Use `[-s|--save]` option to save with a longer login experiation, by default 7 days. Or use `--save 1h`, `--save 365d` to specify a period for expiration. * Remember to `:logout` to protect your login credentials if you use a long experiation." },
    { id: "", title: "", annotation: "", command: ":logout", options: "", short_description: "Logout user.", description: "" },
    { id: "commands-config", title: "Information", annotation: "", command: ":info", options: "", short_description: "Show local config.", description: "Show local configurations and session configurations that saved in browser session storage or local storage." },
    { id: "", title: "", annotation: "", command: ":system", options: "", short_description: "Show system config.", description: "System configuration in server." },
    { id: "commands-cli", title: "CLI (Command-line Interface)", annotation: "", command: ":exit", options: "", short_description: "Exit the program.", description: "This command only available in command-line interface." },
  ];
  return commands;
}

export function pushCommandHistory(command) {
  // ignore masked commands
  if (isCommandMusked(command)) {
    return;
  }

  // Get the existing history or initialize a new array
  let commandHistories = JSON.parse(getSetting("history")) || [];

  // Add new command to the front of the array
  commandHistories.unshift(command);

  // Ensure that only the latest 100 commands are kept
  commandHistories = commandHistories.slice(0, 100);

  // Save the updated history
  setSetting("history", JSON.stringify(commandHistories));
}

export function getHistoryCommand(index) {
  if (getSetting("history") === null) {
    setSetting("history", JSON.stringify([]));
  }

  let commandHistory = JSON.parse(getSetting("history"));
  return commandHistory[index];
}

export function getHistoryCommandIndex() {
  if (getSetting("historyIndex") === null) {
    setSetting("historyIndex", -1);
  }

  return parseInt(getSetting("historyIndex"));
}
