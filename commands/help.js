export default function help(args) {
  const commands = "Commands: \n" +
    ":help - Show this help message.\n" +
    ":entry [ls|list|add] - Manage dictionary entries.\n" +
    ":ls - List all entries, same as :entry ls.\n" +
    ":search [keyword] - Search dictionary.\n" +
    ":log - Show log.\n" +
    ":stats [show|hide|on|off] - Show/hide stats info.\n" +
    ":stream [on|off] - Switch on/off stream mode.\n" +
    ":clear - Clear output.\n";

  return commands;
}
