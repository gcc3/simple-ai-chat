import { initializeSessionMemory } from "../utils/sessionUtils.js";
import { setUserWebStorage } from "../utils/userUtils.js";
import { getSetting } from "../utils/settingsUtils.js";


export default async function login(args) {
  if (args.length < 2 && args.length > 4) {
    return "Usage: :login [username] [password]";
  }

  let userLoginPreviously = false;
  if (getSetting("user")) {
    userLoginPreviously = true;
  }

  const username = args[0];
  const password = args[1];

  let expiresIn = "24h";
  if (args.length == 3) {
    if (args[2] == "--save" || args[2] == "-s") {
      expiresIn = "7d";
    }
  } else if (args.length == 4) {
    if (args[2] == "--save" || args[2] == "-s") {
      expiresIn = args[3];

      if (!expiresIn.endsWith("h") && !expiresIn.endsWith("d")) {
        return "Invalid expiration time. Please use 'h' for hours or 'd' for days.";
      }
    }
  }

  try {
    const response = await fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
        expiresIn: expiresIn,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      // Login successful
      const user = data.user;
      if (!user) {
        throw new Error("User not found.");
      }

      setUserWebStorage(user);
      console.log("User is set to \"" + getSetting("user") + "\".");

      if (userLoginPreviously) {
        initializeSessionMemory();
      }
      return "You're logged in as " + user.username + " (role: `" + user.role + "`, expires in: `" + expiresIn +  "`).";
    }
  } catch (error) {
    // Login failed
    console.error(error);
    return error;
  }
}
