export default function help(args) {
  const commands = "Commands: \n" +
    ":help - Show this help message.\n" +
    ":stop - Stop generating. (⌃c)\n" +
    ":clear - Clear output and reset session. (⌃l)\n" +
    ":fullscreen [on/off] - Use fullscreen mode. (⌃f)\n" +
    ":theme [light/dark] - Change color theme.\n" +
    ":entry [ls|list|add] - Manage dictionary entries.\n" +
    ":ls - List all entries, same as :entry ls.\n" +
    ":add [word] [definition] - Same as :entry add.\n" +
    ":search [keyword] - Search dictionary.\n" +
    ":function [ls|list] - List all supported functions.\n" +
    ":location [on|off] - Switch on/off location service.\n" +
    ":log - Show current session log.\n" +
    ":log [session_id] - Show session logs.\n" +
    ":stats [on|off|show|hide] - Show/hide stats info.\n" +
    ":stream [on|off] - Switch on/off stream mode.\n" +
    ":speak [on|off] - Switch on/off auto speak.\n" +
    ":voice [ls|list] - List all supported voices.\n" +
    ":voice use [voice_name] - Set voice.\n" + 
    ":lang [ls|list] - List all languages.\n" +
    ":lang use [language_code] - Set language.\n" +
    ":session [session_id] - Attach to session.\n" +
    ":role [ls|list|reset] - List all roles, reset role.\n" +
    ":role use [role_name] - Use role.\n" +
    ":user [ls|list] - List all users.\n" +
    ":user [add|delete| [username] - Create or delete a user.\n" +
    ":user set [pass/email] [value] - Change password, set Email.\n" +
    ":user set [key] [value] - Set user config.\n" +
    ":user info - Get logged-in user info and config.\n" +
    ":login [username] [password] - Login user.\n" +
    ":logout - Logout user.\n" +
    ":info - Show local config.\n" +
    ":system - Show system config.\n";

  return commands;
}
