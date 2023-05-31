export default function help(args) {
  const commands = "Commands: \n" +
    ":help - Show this help message.\n" +
    ":entry [ls|list|add] - Manage dictionary entries.\n" +
    ":ls - List all entries, same as :entry ls.\n" +
    ":search [keyword] - Search dictionary.\n" +
    ":log - Show current session log.\n" +
    ":log [all|session_id] - Show all logs or all session logs.\n" +
    ":stats [show|hide|on|off] - Show/hide stats info.\n" +
    ":stream [on|off] - Switch on/off stream mode.\n" +
    ":clear - Clear output.\n";

  return commands;
}
