import { isNode } from "../utils/cliUtils.js";
import { getCommands } from "../command.js";

export default function help(args) {
  let command = args[0];
  let result = "";

  // Get commands
  const commands = getCommands();

  if (command) {
    if (!command.startsWith("\"") || !command.startsWith("\"")) {
      return "Command must be enclosed in double quotes.";
    }

    // Trim command
    command = command.slice(1, -1);
    if (!command.startsWith(":")) {
      command = ":" + command;
    }

    const targetCommands = commands.filter((c) => c.command.startsWith(command));
    if (targetCommands && targetCommands.length > 0) {
      for (let i = 0; i < targetCommands.length; i++) {
        const targetCommand = targetCommands[i];
        result += `${targetCommand.command}`;
        if (targetCommand.description) {
          result += `\n${targetCommand.description}`;
        } else if (targetCommand.short_description) {
          result += "\n" + targetCommand.short_description;
        }
        result += "\n\n";
      }
      
      return result;
    } else {
      return `Command not found.`;
    }
  }

  if (!command) {
    const commands = getCommands();
    result = "Commands:\n";
    commands.forEach((command) => {
      result += `${command.command} - ${command.short_description}\n`;
    });

    if (isNode()) {
      result += ":exit - Exit the program\n";
    }
    result = result.trim();
  }

  return result;
}
