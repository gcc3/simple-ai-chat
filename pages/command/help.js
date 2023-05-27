export default function help() {
  const commands = "commands: \n" +
    ":help - Show this help message.\n" +
    ":entry [ls|list|add] - Manage dictionary entries.\n" +
    ":stream [on|off] - Switch on/off stream mode.\n" +
    ":clear - Clear output.\n";

  return commands;
}
