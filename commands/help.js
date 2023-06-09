export default function help(args) {
  const commands = "Commands: \n" +
    ":help - Show this help message.\n" +
    ":entry [ls|list|add] - Manage dictionary entries.\n" +
    ":ls - List all entries, same as :entry ls.\n" +
    ":search [keyword] - Search dictionary.\n" +
    ":log - Show current session log.\n" +
    ":log [all|session_id] - Show all logs or session logs.\n" +
    ":stats [show|hide|on|off] - Show/hide stats info.\n" +
    ":stream [on|off] - Switch on/off stream mode.\n" +
    ":session [session_id] - Attach to session.\n" +
    ":role [ls|list|reset] - List all roles, reset role\n" +
    ":role use [role_name] - Use role.\n" +
    ":info - Show current config info.\n" +
    ":clear - Clear output and reset.\n";

  return commands;
}
