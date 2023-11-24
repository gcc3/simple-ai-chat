export default function help(args) {
  const commands = "Commands:\n" +
    ":help - Show this help message.\n" +
    ":stop - Stop generating. (⌃c)\n" +
    ":clear - Clear output. (⌃r)\n" +
    ":reset - Clear output and reset session. (⇧⌃r)\n" +
    ":fullscreen - Use fullscreen, same as `:fullscreen default`.\n" +
    ":fullscreen [default/split/off] - Config fullscreen mode.\n" +
    ":theme [light/dark/terminal] - Change color theme.\n" +
    ":entry [ls|list|add] - Manage dictionary entries.\n" +
    ":ls - List all entries, same as `:entry ls`.\n" +
    ":add [word] [definition] - Same as `:entry add`.\n" +
    ":search [keyword] - Search dictionary.\n" +
    ":function [ls|list] - List all supported functions.\n" +
    ":location [on|off] - Switch on/off location service.\n" +
    ":log - Show logs for current session.\n" +
    ":session [ls|list] - List sessions.\n" +
    ":session attach [session_id] - Attach to a session.\n" +
    ":session [del|delete] [session_id] - Delete a session.\n" +
    ":stats [on|off] - Show/hide stats info and scores.\n" +
    ":stream [on|off] - Switch on/off stream mode.\n" +
    ":speak [on|off] - Switch on/off auto speak.\n" +
    ":voice [ls|list] - List all supported voices.\n" +
    ":voice use [voice_name] - Set voice.\n" +
    ":lang [ls|list] - List all languages.\n" +
    ":lang use [language_code] - Set language.\n" +
    ":role [ls|list|reset] - List all roles, reset role.\n" +
    ":role use [role_name] - Use role.\n" +
    ":user add [username] [email?] - Create a user, with email set.\n" +
    // ":user [subscribe|unsubscribe] - Subscribe to extend usage.\n" +
    ":user set pass [value] - Change password.\n" +
    ":user reset pass [username] [email] - Reset password.\n" +
    ":user set [email] [value] - Change email address.\n" +
    ":user info - Get logged-in user info and settings.\n" +
    ":user [del|delete] [username] - Delete user with data.\n" +
    ":login [username] [password] - Login user.\n" +
    ":logout - Logout user.\n" +
    ":info - Show local config.\n" +
    ":system - Show system config.\n";

  return commands;
}
