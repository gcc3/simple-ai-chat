import { setTheme } from "utils/themeUtils.js";

export default async function entry(args) {
  const command = args[0];

  // Get user info, configurations
  if (command === "info") {
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
      localStorage.setItem("user", user.username);
      localStorage.setItem("userSettings", user.settings);

      return "User: " + user.username + "\n" +
             "Email: " + user.email + "\n" +
             "Settings: " + user.settings + "\n"
    } else {
      return "User removed.";
    }
  }

  // Add user
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

  // Set Email
  if (command === "set" && args[1] === "email") {
    if (args.length != 3) {
      return "Usage: :user set email [email]";
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

      return "Email updated.";
    } catch (error) {
      console.error(error);
      return error;
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

    // Update remote settings
    try {
      const response = await fetch("/api/user/update/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: key,
          value: value,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Set local settings too
      if (key === "theme") {
        localStorage.setItem("theme", value);
        setTheme(localStorage.getItem("theme"));
      }
      if (key === "role") {
        localStorage.setItem("role", value);
      }

      return "Setting updated.";
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  return (
    "Usage: :user add [username]" + "\n" +
    "       :user set pass [password]" + "\n" +
    "       :user set email [email]" + "\n" +
    "       :user set [key] [value]" + "\n" +
    "       :user info" + "\n"
  );
}
