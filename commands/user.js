import { verifiyEmailAddress } from "../utils/emailUtils.js";
import { getSettings, getSetting, setSetting } from "../utils/settingsUtils.js";
import { clearLocalUser, refreshLocalUser, generatePassword, updateUserSetting } from "../utils/userUtils.js";


export default async function entry(args) {
  const command = args[0];
  const usage = "Usage: :user [info?]" + "\n" +
                "       :user add [username] [email] [password?]" + "\n" +
                "       :user [del|delete] [username]" + "\n" +
                "       :user set pass [value]" + "\n" +
                "       :user set email [value]" + "\n" +
                "       :user set [key] [value]" + "\n" +
                "       :user reset [key]" + "\n" +
                "       :user reset settings" + "\n" +
                "       :user reset pass [username] [email]" + "\n" +
                "       :user join [group] [password]" + "\n" +
                "       :user leave [group]";

  // Get user info, configurations
  if (!command || command === "info") {
    if (!getSetting("user")) {
      return "Please login.";
    }

    let user = null;
    try {
      const response = await fetch(`/api/user/info`, {
        method: "GET",
        credentials: 'include',
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      user = data.user;
    } catch (error) {
      console.error(error);
      return error;
    }

    if (user) {
      // Refresh local user as latest user info is fetched
      refreshLocalUser(user);

      return JSON.stringify(user, null, 2)
    } else {
      return "User removed.";
    }
  }

  // Add user
  if (command === "add") {
    if (args.length != 3 && args.length != 4) {
      return "Usage: :user add [username] [email] [password?]";
    }

    const username = args[1];
    const email = args[2];
    const password = args[3] || "";

    // Check if the email is valid.
    if (!verifiyEmailAddress(email)) {
      return "Email is invalid.";
    }

    try {
      // Apply the user current UI setting when creating a user
      const theme = getSetting("theme") || "light";
      const fullscreen = getSetting("fullscreen") || "off";
      
      // User initial settings with some settings overwritten
      let userDefaultSettings = getSettings("user_default");
      userDefaultSettings.theme = theme;
      userDefaultSettings.fullscreen = fullscreen;
      userDefaultSettings.groupPassword = generatePassword();

      const response = await fetch("/api/user/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          settings: JSON.stringify(userDefaultSettings),
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      } else {
        return data.error;
      }
    } catch (error) {
      console.error("Error:", error);
      return error;
    }
  }

  // Delete user
  if (command === "delete" || command === "del") {
    if (args.length != 2) {
      return "Usage: :user [del|delete] [username]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    const username = args[1];
    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        clearLocalUser();
      }
      return data.message;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Set password
  if (command === "set" && args[1] === "pass") {
    if (args.length != 3) {
      return "Usage: :user set pass [password]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    try {
      const response = await fetch("/api/user/update/password", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: args[2],
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Password updated.";
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Set email
  if (command === "set" && args[1] === "email") {
    if (args.length != 3) {
      return "Usage: :user set email [email]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    const email = args[2];
    try {
      const response = await fetch("/api/user/update/email", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return data.message;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Set settings
  if (command === "set" && args[1]) {
    if (args.length != 3) {
      return "Usage: :user set [key] [value]";
    }
    
    if (!getSetting("user")) {
      return "Please login.";
    }

    // Check value must be quoted with double quotes.
    if (!args[2].startsWith("\"") || !args[2].endsWith("\"")) {
      return "Setting value must be quoted with double quotes.";
    }
    
    const key = args[1];
    const value = args[2].slice(1, -1);

    try {
      const data = await updateUserSetting(key, value);
      if (data) {
        if (data.success) {
          // Refresh local user as the user.settings is updated
          refreshLocalUser();
          
          return "Setting updated.";
        } else {
          return data.error;
        }
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }
  
  // Set settings
  if (command === "reset" && args[1]) {
    if (args.length != 2) {
      return "Usage: :user reset [key]";
    }
    
    if (!getSetting("user")) {
      return "Please login.";
    }

    const key = args[1];

    try {
      const data = await updateUserSetting(key);
      if (data) {
        if (data.success) {
          // Refresh local user as the user.settings is updated
          refreshLocalUser();
          
          return "Setting reset.";
        } else {
          return data.error;
        }
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Reset password
  if (command === "reset" && args[1] === "pass") {
    if (args.length != 4) {
      return "Usage: :user reset pass [username] [email]";
    }

    const username = args[2];
    const email = args[3];

    // Check if the email is valid.
    if (!verifiyEmailAddress(email)) {
      return "Email is invalid.";
    }

    try {
      const response = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return data.message;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Reset settings
  // :user reset settings
  if (command === "reset" && args[1] === "settings") {
    try {
      const response = await fetch("/api/user/reset-settings", {
        method: "POST",
        credentials: 'include',
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return data.message;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Join a group
  if (command === "join") {
    if (args.length != 3) {
      return "Usage: :user join [group] [password]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    const group = args[1];
    const password = args[2];

    try {
      const response = await fetch("/api/user/group/join", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group,
          password,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Leave a group
  if (command === "leave") {
    if (args.length != 2) {
      return "Usage: :user leave [group]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    const group = args[1];

    try {
      const response = await fetch("/api/user/group/leave", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  return usage;
}
