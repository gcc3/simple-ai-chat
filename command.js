
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
import search from "commands/search.js";
import node from "commands/node.js";
import set from "commands/set.js";
import generate from "commands/generate.js";
import { isCommandMusked } from "utils/passwordUtils.js";

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
  
  if (command.startsWith(":help")) return help(args);
  if (command.startsWith(":stats")) return stats(args);
  if (command.startsWith(":eval")) return eval_(args);
  if (command.startsWith(":stream")) return stream(args);
  if (command.startsWith(":login")) return login(args);
  if (command.startsWith(":logout")) return logout(args);
  if (command.startsWith(":log")) return log(args);
  if (command.startsWith(":info")) return info(args);
  if (command.startsWith(":ls")) return ls(args);
  if (command.startsWith(":session")) return session(args);
  if (command.startsWith(":role")) return role(args);
  if (command.startsWith(":clear")) return clear(args);
  if (command.startsWith(":reset")) return reset(args);
  if (command.startsWith(":speak")) return speak(args);
  if (command.startsWith(":lang")) return lang(args);
  if (command.startsWith(":stop")) return stop(args);
  if (command.startsWith(":function")) return function_(args);
  if (command.startsWith(":location")) return location(args);
  if (command.startsWith(":voice")) return voice(args);
  if (command.startsWith(":system")) return system(args);
  if (command.startsWith(":fullscreen")) return fullscreen(args);
  if (command.startsWith(":theme")) return theme(args);
  if (command.startsWith(":user")) return user(args);
  if (command.startsWith(":store")) return store(args, files);
  if (command.startsWith(":search")) return search(args);
  if (command.startsWith(":node")) return node(args);
  if (command.startsWith(":set")) return set(args);
  if (command.startsWith(":generate")) return generate(args);
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
    { id: "commands-general", title: "General", annotation: "", command: ":help [command?]", short_description: "Show command help.", description: "Show command help. The command should be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":stop", short_description: "Stop generating. (⌃c)", description: "Stop generating. Same as in a shell, use control + c can stop executing." },
    { id: "", title: "", annotation: "", command: ":clear", short_description: "Clear output. (⌃r)", description: "Clear output. This will only reset output to empty." },
    { id: "", title: "", annotation: "", command: ":reset", short_description: "Clear output and reset session. (⇧⌃r)", description: "Clear output and reset session. This will reset the AI memory as session is reset. It will not reset role, store and node." },
    { id: "", title: "", annotation: "", command: ":fullscreen [off?]", short_description: "Fullscreen default mode (F11).", description: "Fullscreen default mode, or turn it off" },
    { id: "", title: "", annotation: "", command: ":fullscreen split", short_description: "Fullscreen split mode (⌃|).", description: "Use fullscreen split mode, to split screen left and right. Or use off to turn fullscreen off. Fullscreen split mode will makes easier to input data and review output, especially when dealing with lengthy responses." },
    { id: "", title: "", annotation: "", command: ":theme [light/dark/terminal]", short_description: "Change color theme.", description: "" },
    { id: "", title: "", annotation: "", command: ":function [ls|list]", short_description: "List all supported functions.", description: "To directly call a function, use `!function_name(parameters)`" },
    { id: "", title: "", annotation: "", command: ":location [on|off]", short_description: "Switch on/off location service.", description: "When you turn on the location service, the AI can provide answers based on your location." },
    { id: "", title: "", annotation: "", command: ":stream [on|off]", short_description: "Switch on/off stream mode.", description: "When the stream is off, the text will be displayed once the answer is fully generated." },
    { id: "", title: "", annotation: "", command: ":set [key] [value]", short_description: "Set local configurations.", description: "Set session configurations and local configurations, the key must be one of session storage or local storage key, case-insensitive. For values include space(s) must be enclosed in double quates. To check the available keys, use command `:info`. Example: `set memlength 0`, this can set the memory to 0 and save a lots of tokens. If you want to use function calling don't set to 0, 1 call = 1 mem, and response also increase 1 mem." },
    { id: "commands-session", title: "Sessions & Logs", annotation: "", command: ":log", short_description: "Show logs for current session.", description: "" },
    { id: "", title: "", annotation: "", command: ":ls", short_description: "List sessions, same as `:session ls`.", description: "" },
    { id: "", title: "", annotation: "", command: ":session [ls|list]", short_description: "List sessions.", description: "List sessions with short user input." },
    { id: "", title: "", annotation: "", command: ":session attach [session_id]", short_description: "Attach to a session.", description: "When attached to a session, you can use left/right arraw key or J/K key to navigate between session logs." },
    { id: "commands-eval", title: "Stats & Self-evaluation", annotation: "", command: ":stats [on|off]", short_description: "Show stats info.", description: "A stats information will show below." },
    { id: "", title: "", annotation: "", command: ":eval [on|off]", short_description: "Enable the self evaluation score.", description: "" },
    { id: "commands-speak", title: "Speak", annotation: "", command: ":speak [on|off]", short_description: "Switch on/off auto speak.", description: "Auto read the result with system TTS voice." },
    { id: "", title: "", annotation: "", command: ":voice [ls|list]", short_description: "List all supported voices.", description: "List all system supported TTS voices." },
    { id: "", title: "", annotation: "", command: ":voice use [voice_name]", short_description: "Set voice.", description: "To use a voice by inputting its name, the voice_name must be enclosed in double quotes. For example, \"Samantha\" or \"John\"." },
    { id: "", title: "", annotation: "", command: ":lang [ls|list]", short_description: "List all languages.", description: "List all available languages for voice." },
    { id: "", title: "", annotation: "", command: ":lang use [language_code]", short_description: "Set language.", description: "Set a language for voice." },
    { id: "commands-role", title: "Roles", annotation: "For user's custom role command refer `:user role` commands.", command: ":role [name?]", short_description: "Show role prompt.", description: "" },
    { id: "", title: "", annotation: "", command: ":role use [role_name]", short_description: "Use a role.", description: "" },
    { id: "", title: "", annotation: "", command: ":role [ls|list]", short_description: "List available roles.", description: "Roles include user custom roles and system roles." },
    { id: "", title: "", annotation: "", command: ":role reset", short_description: "Reset role to empty.", description: "Clear the current role." },
    { id: "commands-store", title: "Data Store", annotation: "", command: ":search [text]", short_description: "Search from current data store.", description: "Search to get inforamtion from the current data store with nature language." },
    { id: "", title: "", annotation: "", command: ":store [name?]", short_description: "Show data store detail.", description: "Show detail of a data store. The store name is optional. If no name is input, it will return the current data store details." },
    { id: "", title: "", annotation: "", command: ":store [ls|list]", short_description: "List available data stores.", description: "Include the user data stores and shared data stores." },
    { id: "", title: "", annotation: "", command: ":store [use|unuse] [name]", short_description: "Use/unuse a data store.", description: "" },
    { id: "", title: "", annotation: "", command: ":store reset", short_description: "Reset data store to empty.", description: "Reset the current data store to empty. This will not reset data store data, to reset data use `:store data reset`" },
    { id: "", title: "", annotation: "", command: ":store add [engine] [name]", short_description: "Create a data store.", description: "Create a database with engine and store name. Supported engines: \"vectara\", \"mysql\". Engine and store name must be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":store init [name?]", short_description: "Initialize a data store.", description: "Initialize the current data store. Store name (optional) should be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":store set owner [owner]", short_description: "Change store owner.", description: "" },
    { id: "", title: "", annotation: "", command: ":store set [key] [value]", short_description: "Setup a store settings.", description: "Adjust the values of data store settings. The value must be enclosed in double quates." },
    { id: "", title: "", annotation: "", command: ":store data upload [file]", short_description: "Upload file for indexing.", description: "Upload file for vector database indexing, support .txt, .docx, .pdf files." },
    { id: "", title: "", annotation: "", command: ":store data reset [name?]", short_description: "Reset store data.", description: "" },
    { id: "", title: "", annotation: "", command: ":store [del|delete] [name]", short_description: "Delete a store.", description: "" },
    { id: "commands-node", title: "Node (Node AI)", annotation: "", command: ":generate [input]", short_description: "Generate from node.", description: "Generate from the current node (Node AI)." },
    { id: "", title: "", annotation: "", command: ":node [name?]", short_description: "Show node detail.", description: "The node name is optional. If no name is input, it will return the current node details." },
    { id: "", title: "", annotation: "", command: ":node [ls|list]", short_description: "List available nodes.", description: "Include the user data nodes and shared nodes." },
    { id: "", title: "", annotation: "", command: ":node use [name]", short_description: "Use a node.", description: "" },
    { id: "", title: "", annotation: "", command: ":node reset", short_description: "Reset node to empty.", description: "Reset the current node to empty." },
    { id: "", title: "", annotation: "", command: ":node add [name]", short_description: "Create a node.", description: "" },
    { id: "", title: "", annotation: "", command: ":node [del|delete] [name]", short_description: "Delete a node.", description: "" },
    { id: "", title: "", annotation: "", command: ":node set owner [owner]", short_description: "Change node owner.", description: "" },
    { id: "", title: "", annotation: "", command: ":node set [key] [value]", short_description: "Setup a node settings.", description: "Users can adjust the values of node settings." },
    { id: "commands-user", title: "User", annotation: "", command: ":user add [username] [email] [password?]", short_description: "Create a user.", description: "This command will create a user. After creating, an email verification is required. Setting a password is optional. If you choose not to set a password, the system will generate one for you and send it to your email." },
    { id: "", title: "", annotation: "", command: ":user set pass [value]", short_description: "Change password.", description: "After changing the password, the user will receive an email notification." },
    { id: "", title: "", annotation: "", command: ":user set email [value]", short_description: "Change email address.", description: "After changing their email address, the user will receive a verification email. Email verification is mandatory." },
    { id: "", title: "", annotation: "", command: ":user info", short_description: "Get logged-in user info and settings.", description: "Check user settings." },
    { id: "", title: "", annotation: "", command: ":user set [key] [value]", short_description: "Change user settings.", description: "Users can adjust their settings, and any values must be enclosed in double quotes." },
    { id: "", title: "", annotation: "", command: ":user reset pass [username] [email]", short_description: "Recover password.", description: "A recovery email containing a generated password will be sent to the user. If you forgot your password and cannot login your account, please use this command to recover your password." },
    { id: "", title: "", annotation: "", command: ":user role [add|set] [role_name] [prompt]", short_description: "Add a role.", description: "" },
    { id: "", title: "", annotation: "", command: ":user role [del|delete] [role_name]", short_description: "Delete a role.", description: "" },
    { id: "", title: "", annotation: "", command: ":user join [group] [password]", short_description: "Join a group.", description: "Join a group. When creating a user, a group with the same name will also be created, and owned by this user. A user can join any group to access shared data. The password is generated and set in the user's settings." },
    { id: "", title: "", annotation: "", command: ":user leave [group]", short_description: "Leave a group.", description: "" },
    { id: "", title: "", annotation: "", command: ":user [del|delete] [username]", short_description: "Delete user with data.", description: "" },
    { id: "", title: "", annotation: "", command: ":login [username] [password]", short_description: "Login user.", description: "Login user and load configurations from user settings." },
    { id: "", title: "", annotation: "", command: ":logout", short_description: "Logout user.", description: "" },
    { id: "commands-config", title: "Information", annotation: "", command: ":info", short_description: "Show local config.", description: "Show local configurations and session configurations that saved in browser session storage or local storage." },
    { id: "", title: "", annotation: "", command: ":system", short_description: "Show system config.", description: "System configuration in server." },
  ];
  return commands;
}

export function pushCommandHistory(command) {
  // ignore masked commands
  if (command.startsWith(":login")) return;
  if (command.startsWith(":user add")) return;
  if (command.startsWith(":user join")) return;
  if (command.startsWith(":user set pass")) return;

  // Get the existing history or initialize a new array
  let commandHistories = JSON.parse(sessionStorage.getItem("history")) || [];

  // Add new command to the front of the array
  commandHistories.unshift(command);

  // Ensure that only the latest 10 commands are kept
  commandHistories = commandHistories.slice(0, 10);

  // Save the updated history
  sessionStorage.setItem("history", JSON.stringify(commandHistories));
}

export function getHistoryCommand(index) {
  if (sessionStorage.getItem("history") === null) {
    sessionStorage.setItem("history", JSON.stringify([]));
  }

  let commandHistory = JSON.parse(sessionStorage.getItem("history"));
  return commandHistory[index];
}

export function getHistoryCommandIndex() {
  if (sessionStorage.getItem("historyIndex") === null) {
    sessionStorage.setItem("historyIndex", -1);
  }

  return parseInt(sessionStorage.getItem("historyIndex"));
}
