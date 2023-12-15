
import help from "./commands/help.js";
import stats from "./commands/stats.js";
import stream from "./commands/stream.js";
import entry from "./commands/entry.js";
import ls from "./commands/ls.js";
import add from "./commands/add.js";
import search from "./commands/search.js";
import log from "./commands/log.js";
import info from "./commands/info.js";
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

export default function commands(input) {
  let command = input;
  let args = [];
  
  if (input.indexOf(' ') !== -1) {
    // Has arguments
    command = input.substring(0, input.indexOf(' '));
    args = extractArgs(input.substring(input.indexOf(' ') + 1));
    console.log("Command Arguments: " + args);
  }
  
  if (command.startsWith(":help")) return help(args);
  if (command.startsWith(":entry")) return entry(args);
  if (command.startsWith(":ls")) return ls(args);
  if (command.startsWith(":add")) return add(args);
  if (command.startsWith(":stats")) return stats(args);
  if (command.startsWith(":stream")) return stream(args);
  if (command.startsWith(":search")) return search(args);
  if (command.startsWith(":login")) return login(args);
  if (command.startsWith(":logout")) return logout(args);
  if (command.startsWith(":log")) return log(args);
  if (command.startsWith(":info")) return info(args);
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
  if (command.startsWith(":store")) return store(args);
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

/*
  Deprecated: 
  ":entry [ls|list|add] - Manage dictionary entries.\n" +
  ":ls - List all entries, same as `:entry ls`.\n" +
  ":add [word] [definition] - Same as `:entry add`.\n" +
  ":search [keyword] - Search dictionary.\n" +
*/
export function getCommands() {
  const commands = [
    { command: ":help", short_description: "Show this help message.", description: "" },
    { command: ":stop", short_description: "Stop generating. (⌃c)", description: "" },
    { command: ":clear", short_description: "Clear output. (⌃r)", description: "" },
    { command: ":reset", short_description: "Clear output and reset session. (⇧⌃r)", description: "" },
    { command: ":fullscreen", short_description: "Use fullscreen mode.", description: "" },
    { command: ":fullscreen [split|off]", short_description: "Fullscreen split mode or turn off.", description: "" },
    { command: ":theme [light/dark/terminal]", short_description: "Change color theme.", description: "" },
    { command: ":function [ls|list]", short_description: "List all supported functions.", description: "" },
    { command: ":location [on|off]", short_description: "Switch on/off location service.", description: "" },
    { command: ":log", short_description: "Show logs for current session.", description: "" },
    { command: ":session [ls|list]", short_description: "List sessions.", description: "" },
    { command: ":session attach [session_id]", short_description: "Attach to a session.", description: "" },
    { command: ":session [del|delete] [session_id]", short_description: "Delete a session.", description: "" },
    { command: ":stats [on|off]", short_description: "Show/hide stats info and scores.", description: "" },
    { command: ":stream [on|off]", short_description: "Switch on/off stream mode.", description: "" },
    { command: ":speak [on|off]", short_description: "Switch on/off auto speak.", description: "" },
    { command: ":voice [ls|list]", short_description: "List all supported voices.", description: "" },
    { command: ":voice use [voice_name]", short_description: "Set voice.", description: "" },
    { command: ":lang [ls|list]", short_description: "List all languages.", description: "" },
    { command: ":lang use [language_code]", short_description: "Set language.", description: "" },
    { command: ":role [name?]", short_description: "Show role/assistant prompt.", description: "" },
    { command: ":role use [role_name]", short_description: "Use a role/assistant.", description: "" },
    { command: ":role [ls|list]", short_description: "List available roles/assistants.", description: "" },
    { command: ":role [reset]", short_description: "Reset role to empty.", description: "" },
    { command: ":store [name?]", short_description: "Show data store detail.", description: "" },
    { command: ":store [ls|list]", short_description: "List available data stores.", description: "" },
    { command: ":store use [name]", short_description: "Use a data store.", description: "" },
    { command: ":store reset", short_description: "Reset data store to empty.", description: "" },
    { command: ":store add [name]", short_description: "Create a store.", description: "" },
    { command: ":store [del|delete] [name]", short_description: "Delete a store.", description: "" },
    { command: ":store set owner [owner]", short_description: "Change store owner.", description: "" },
    { command: ":store set [key] [value]", short_description: "Setup a store settings.", description: "" },
    { command: ":user add [username] [email] [password?]", short_description: "Create a user.", description: "" },
    { command: ":user set pass [value]", short_description: "Change password.", description: "" },
    { command: ":user set email [value]", short_description: "Change email address.", description: "" },
    { command: ":user set [key] [value]", short_description: "Change user settings.", description: "" },
    { command: ":user reset pass [username] [email]", short_description: "Recover password.", description: "" },
    { command: ":user role [add|set] [role_name] [prompt]", short_description: "Add an assistant.", description: "" },
    { command: ":user role [del|delete] [role_name]", short_description: "Delete a role/assistant.", description: "" },
    { command: ":user join [group] [password]", short_description: "Join a group.", description: "" },
    { command: ":user leave [group]", short_description: "Leave a group.", description: "" },
    { command: ":user info", short_description: "Get logged-in user info and settings.", description: "" },
    { command: ":user [del|delete] [username]", short_description: "Delete user with data.", description: "" },
    { command: ":login [username] [password]", short_description: "Login user.", description: "" },
    { command: ":logout", short_description: "Logout user.", description: "" },
    { command: ":info", short_description: "Show local config.", description: "" },
    { command: ":system", short_description: "Show system config.", description: "" },
  ];
  return commands;
}