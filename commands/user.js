import { setTheme } from "utils/themeUtils.js";

export default async function entry(args) {
  const command = args[0];

  if (command === "logout") {
    localStorage.removeItem("user");

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
          name: username,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      localStorage.setItem("user", username);
      return "User created, default password is " + data.password;
    } catch (error) {
      console.error(error);
      return "Error.";
    }
  }

  if (command === "set" && args[1] === "pass") {
    if (args.length != 3) {
      return "Usage: :user set pass [password]";
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

  // Setup settings
  if (command === "set" && args[1] !== "pass") {
    if (args.length != 3) {
      return "Usage: :user set [key] [value]";
    }

    try {
      const response = await fetch("/api/user/update/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: localStorage.getItem("user"),
          key: args[1],
          value: args[2],
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
    "       :user set [key] [value]" + "\n" +
    "       :user login [username] [password]" + "\n" +
    "       :user logout"
  );
}
