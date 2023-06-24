
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
  if (command.startsWith(":log")) return log(args);
  if (command.startsWith(":info")) return info(args);
  if (command.startsWith(":session")) return session(args);
  if (command.startsWith(":role")) return role(args);
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