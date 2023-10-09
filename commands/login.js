import { setTheme } from "utils/themeUtils.js";

export default async function login(args) {
  if (args.length != 2) {
    return "Usage: :login [username] [password]";
  }

  const username = args[0];
  const password = args[1];

  let user = null;
  try {
    const response = await fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    user = data.user;
    localStorage.setItem("user", user.username);
    localStorage.setItem("userSettings", user.settings);
    console.log("User is set to \"" + localStorage.getItem("user") + "\".");

    // Settings
    if (user.settings) {
      const settings = JSON.parse(user.settings);

      if (settings.theme) {
        localStorage.setItem("theme", settings.theme);
        setTheme(localStorage.getItem("theme"));
      }

      if (settings.role) {
        localStorage.setItem("role", settings.role);
      }

      if (settings.speak) {
        localStorage.setItem("useSpeak", settings.speak == "on" ? "true" : "false");
      }

      if (settings.stats) {
        localStorage.setItem("useStats", settings.stats == "on" ? "true" : "false");
      }
    }

    return "Login successful.";
  } catch (error) {

    // Login failed
    console.error(error);
    return error;
  }
}
