
import help from "./commands/help.js";
import stats from "./commands/stats.js";
import eval_ from "./commands/eval.js";
import stream from "./commands/stream.js";
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
import search from "commands/search.js";

export default function commands(input, files) {
  let command = input;
  let args = [];
  
  if (input.indexOf(' ') !== -1) {
    // Has arguments
    command = input.substring(0, input.indexOf(' '));

    args = extractArgs(input.substring(input.indexOf(' ') + 1));
    if (args.length > 0) {
      console.log("Command Arguments: " + args);
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

function extractFiles(str) {
  const regex = /\+file\[(https?:\/\/[^\]]+)\]/g; // Global regular expression to find all URLs inside +file[...]
  const urls = [];
  let match;
  while ((match = regex.exec(str)) !== null) {
      urls.push(match[1]); // Add each found URL to the array
  }
  return urls; // Return the array of URLs
}

export function getCommands() {
  const commands = [
    { id: "commands-general", command: ":help", short_description: "Show command help.", description: "" },
    { id: "", command: ":stop", short_description: "Stop generating. (⌃c)", description: "" },
    { id: "", command: ":clear", short_description: "Clear output. (⌃r)", description: "" },
    { id: "", command: ":reset", short_description: "Clear output and reset session. (⇧⌃r)", description: "" },
    { id: "", command: ":fullscreen", short_description: "Use fullscreen mode.", description: "" },
    { id: "", command: ":fullscreen [split|off]", short_description: "Fullscreen split mode or turn off.", description: "" },
    { id: "", command: ":theme [light/dark/terminal]", short_description: "Change color theme.", description: "" },
    { id: "", command: ":function [ls|list]", short_description: "List all supported functions.", description: "" },
    { id: "", command: ":location [on|off]", short_description: "Switch on/off location service.", description: "" },
    { id: "", command: ":log", short_description: "Show logs for current session.", description: "" },
    { id: "", command: ":session [ls|list]", short_description: "List sessions.", description: "" },
    { id: "", command: ":session attach [session_id]", short_description: "Attach to a session.", description: "" },
    { id: "", command: ":session [del|delete] [session_id]", short_description: "Delete a session.", description: "" },
    { id: "", command: ":stats [on|off]", short_description: "Show stats info.", description: "" },
    { id: "", command: ":eval [on|off]", short_description: "Enable the self evaluation score.", description: "" },
    { id: "", command: ":stream [on|off]", short_description: "Switch on/off stream mode.", description: "" },
    { id: "", command: ":speak [on|off]", short_description: "Switch on/off auto speak.", description: "" },
    { id: "", command: ":voice [ls|list]", short_description: "List all supported voices.", description: "" },
    { id: "", command: ":voice use [voice_name]", short_description: "Set voice.", description: "" },
    { id: "", command: ":lang [ls|list]", short_description: "List all languages.", description: "" },
    { id: "", command: ":lang use [language_code]", short_description: "Set language.", description: "" },
    { id: "commands-role", command: ":role [name?]", short_description: "Show role/assistant prompt.", description: "" },
    { id: "", command: ":role use [role_name]", short_description: "Use a role/assistant.", description: "" },
    { id: "", command: ":role [ls|list]", short_description: "List available roles/assistants.", description: "" },
    { id: "", command: ":role [reset]", short_description: "Reset role to empty.", description: "" },
    { id: "commands-store", command: ":search [text]", short_description: "Search from data store.", description: "" },
    { id: "", command: ":store [name?]", short_description: "Show data store detail.", description: "" },
    { id: "", command: ":store [ls|list]", short_description: "List available data stores.", description: "" },
    { id: "", command: ":store use [name]", short_description: "Use a data store.", description: "" },
    { id: "", command: ":store reset", short_description: "Reset data store to empty.", description: "" },
    { id: "", command: ":store add [name]", short_description: "Create a store.", description: "" },
    { id: "", command: ":store [del|delete] [name]", short_description: "Delete a store.", description: "" },
    { id: "", command: ":store data upload [file]", short_description: "Upload file for indexing.", description: "" },
    { id: "", command: ":store data reset [name?]", short_description: "Reset store data.", description: "" },
    { id: "", command: ":store set owner [owner]", short_description: "Change store owner.", description: "" },
    { id: "", command: ":store set [key] [value]", short_description: "Setup a store settings.", description: "" },
    { id: "commands-user", command: ":user add [username] [email] [password?]", short_description: "Create a user.", description: "" },
    { id: "", command: ":user set pass [value]", short_description: "Change password.", description: "" },
    { id: "", command: ":user set email [value]", short_description: "Change email address.", description: "" },
    { id: "", command: ":user set [key] [value]", short_description: "Change user settings.", description: "" },
    { id: "", command: ":user reset pass [username] [email]", short_description: "Recover password.", description: "" },
    { id: "", command: ":user role [add|set] [role_name] [prompt]", short_description: "Add an assistant.", description: "" },
    { id: "", command: ":user role [del|delete] [role_name]", short_description: "Delete a role/assistant.", description: "" },
    { id: "", command: ":user join [group] [password]", short_description: "Join a group.", description: "" },
    { id: "", command: ":user leave [group]", short_description: "Leave a group.", description: "" },
    { id: "", command: ":user info", short_description: "Get logged-in user info and settings.", description: "" },
    { id: "", command: ":user [del|delete] [username]", short_description: "Delete user with data.", description: "" },
    { id: "", command: ":login [username] [password]", short_description: "Login user.", description: "" },
    { id: "", command: ":logout", short_description: "Logout user.", description: "" },
    { id: "", command: ":info", short_description: "Show local config.", description: "" },
    { id: "", command: ":system", short_description: "Show system config.", description: "" },
  ];
  return commands;
}
