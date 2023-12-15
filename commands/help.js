import { getCommands } from "command.js";

export default function help(args) {
  const commands = getCommands();

  let result = "Commands:\n";
  commands.forEach((command) => {
    result += `${command.command} - ${command.short_description}\n`;
  });

  return result;
}
