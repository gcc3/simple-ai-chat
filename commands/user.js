import { setTheme } from "utils/themeUtils.js";

export default async function entry(args) {
  const command = args[0];

  if (command === "info") {
    const username = localStorage.getItem("user");

    if (username) {
      let user = null;
      try {
        const response = await fetch(`/api/user/${username}`);
  
        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }
  
        user = data;
      } catch (error) {
        console.error(error);
      }
  
      if (user) {
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userSettings", user.settings);

        return "User: " + username + "\n" +
               "Email: " + user.email + "\n" +
               "Settings: " + user.settings + "\n"
      } else {
        return "User removed.";
      }
    } else {
      return "Please login.";
    }
  }

  if (command === "logout") {
    // Clear user info
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userSettings");

    // Reset query id to forget previous memory
    localStorage.setItem("queryId", Date.now());

    if (localStorage.getItem("role")) {
      localStorage.setItem("role", "");
    }
    return "Logout successful.";
  }

  if (command === "login") {
    if (args.length != 3) {
      return "Usage: :user login [username] [password]";
    }

    const username = args[1];
    let user = null;
    try {
      const response = await fetch(`/api/user/${username}`);

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      user = data;
    } catch (error) {
      console.error(error);
    }

    if (user) {
      if (user.password !== args[2]) {
        return "Password incorrect.";
      }

      localStorage.setItem("user", user.name);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userSettings", user.settings);
      console.log("User set to ", localStorage.getItem("user"));

      // Settings
      if (user.settings) {
        const settings = JSON.parse(user.settings);

        if (settings.theme) {
          localStorage.setItem("theme", settings.theme);
          setTheme(localStorage.getItem("theme"));
          console.log("Theme applied: ", localStorage.getItem("theme"));
        }

        if (settings.role) {
          localStorage.setItem("role", settings.role);
          console.log("Role applied: ", localStorage.getItem("role"));
        }
      }

      return "Login successful.";
    } else {
      return "User not found.";
    }
  }

  if (command === "add") {
    if (args.length != 2) {
      return "Usage: :user add [username]";
    }

    const username = args[1];
    try {
      const response = await fetch("/api/user/add", {
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
        localStorage.setItem("user", username);
        localStorage.setItem("userEmail", "");
        localStorage.setItem("userSettings", "");
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

    if (!localStorage.getItem("user")) {
      return "Please login."
    }

    try {
      const response = await fetch("/api/user/update/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: localStorage.getItem("user"),
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
      return "Error.";
    }
  }

  // Set Email
  if (command === "set" && args[1] === "email") {
    if (args.length != 3) {
      return "Usage: :user set email [email]";
    }

    if (!localStorage.getItem("user")) {
      return "Please login."
    }

    const email = args[2];
    try {
      const response = await fetch("/api/user/update/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: localStorage.getItem("user"),
          email: email,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Email updated.";
    } catch (error) {
      console.error(error);
      return "Error.";
    }
  }

  // Set settings
  if (command === "set") {
    if (args.length != 3) {
      return "Usage: :user set theme [light/dark]" + "\n" +
             "       :user set role [role]" + "\n";
    }

    const key = args[1];
    let value = args[2];

    // Value trim and validiation
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }

    // Check key is valid
    const validKeys = ['theme', 'role'];
    if (!validKeys.includes(key)) {
      return "Usage: :user set theme [light/dark]" + "\n" +
             "       :user set role [role]" + "\n";
    }

    // Set local settings
    if (key === "theme") {
      localStorage.setItem("theme", value);
      setTheme(localStorage.getItem("theme"));
    }
    if (key === "role") {
      localStorage.setItem("role", value);
    }

    // Update remote settings
    try {
      const response = await fetch("/api/user/update/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: localStorage.getItem("user"),
          key: key,
          value: value,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Setting updated.";
    } catch (error) {
      console.error(error);
      return "Error.";
    }
  }

  return (
    "Usage: :user add [username]" + "\n" +
    "       :user set pass [password]" + "\n" +
    "       :user set email [email]" + "\n" +
    "       :user set [key] [value]" + "\n" +
    "       :user info" + "\n" +
    "       :user login [username] [password]" + "\n" +
    "       :user logout"
  );
}
