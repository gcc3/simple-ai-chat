import { setTheme } from "utils/themeUtils.js";

export default async function login(args) {
  if (args.length != 2) {
    return "Usage: :login [username] [password]";
  }

  const username = args[0];
  const password = args[1];

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
    if (user.password !== password) {
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
      }

      if (settings.role) {
        localStorage.setItem("role", settings.role);
      }
    }

    return "Login successful.";
  } else {
    return "User not found.";
  }
}
