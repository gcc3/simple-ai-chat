export default function help(args) {
  const commands = 
    "System command:" + "\n" +
    ":help - Show this help message.\n" +
    ":info - Show local config.\n" +
    ":system - Show system config.\n" + "\n" +

    "Configuration commands: \n" +
    ":clear - Clear output. (⌃r)\n" +
    ":reset - Clear output and reset session. (⇧⌃r)\n" +
    ":stop - Stop generating. (⌃c)\n" +
    ":fullscreen - Use fullscreen, same as `:fullscreen default`.\n" +
    ":fullscreen [default/split/off] - Config fullscreen mode.\n" +
    ":theme [light/dark] - Change color theme.\n" +
    ":function [ls|list] - List all supported functions.\n" +
    ":location [on|off] - Switch on/off location service.\n" + 
    ":stats [on|off] - Show/hide stats info and scores.\n" +
    ":stream [on|off] - Switch on/off stream mode.\n" +
    ":speak [on|off] - Switch on/off auto speak.\n" +
    ":voice [ls|list] - List all supported voices.\n" +
    ":voice use [voice_name] - Set voice.\n" + 
    ":lang [ls|list] - List all languages.\n" +
    ":lang use [language_code] - Set language.\n" +
    ":role [ls|list|reset] - List all roles, reset role.\n" +
    ":role use [role_name] - Use role.\n" + "\n" +

    "Session commands:" + "\n" +
    ":log - Show logs for current session.\n" +
    ":session [ls|list] - List sessions.\n" +
    ":ls - List sessions, same as `:session ls`.\n" +
    ":session attach [session_id] - Attach to a session.\n" +
    ":session [del|delete] [session_id] - Delete a session.\n" + "\n" +
    
    "User commands:" + "\n" +
    ":user add [username] [email?] - Create a user.\n" +
    ":user reset [username] - Reset user password.\n" +
    ":user [use|login] [username] - Login user.\n" +
    ":user logout - Logout user.\n" +
    ":user set [pass/email] [value] - Change password, set Email.\n" +
    ":user info - Get logged-in user info and settings.\n" +
    ":user export [username] - Export all user data.\n" +
    ":user [delete|del] [username] - Delete user with data prune.\n" +
    ":user [ls|list] - List all users.\n" +
    ":login [username] [password] - Same as `:user login`\n" +
    ":logout - Logout user, same as `:user logout`\n" + "\n" +

    "Dictionary search commands:\n" +
    ":add [word] [definition] - Same as `:entry add`.\n" +
    ":search [keyword] - Search dictionary.\n" + 
    ":entry [ls|list|add] - Manage dictionary entries.\n";

  return commands;
}
