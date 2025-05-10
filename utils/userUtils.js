import { setTheme } from "./themeUtils.js";
import { initializeSessionMemory } from "./sessionUtils.js";
import emitter from "./eventsUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export function setUserWebStorage(user) {
  if (!user.username || !user.settings) {
    console.warn("User data is incomplete, clearing local user data...");

    // Clear local user data
    if (getSetting("user")) {
      clearUserWebStorage();

      // Clear auth cookie
      document.cookie = "auth=; Path=/;";
      console.log("User data is incomplete, local user data cleared.");
    }
    return;
  }

  // 1. Set local user
  setSetting("user", user.username);

  // 2. Overwrite local settings
  const settings = user.settings;

  // lang
  if ("lang" in settings) {
    setSetting("lang", settings.lang);
  }

  // theme
  if ("theme" in settings) {
    setSetting("theme", settings.theme);
    setTheme(getSetting("theme"));
  }

  // fullscreen
  if ("fullscreen" in settings) {
    if (getSetting("fullscreen") && settings.fullscreen != getSetting("fullscreen") && !getSetting("fullscreen").includes("force")) {
      setSetting("fullscreen", settings.fullscreen);
      emitter.emit("ui:set_fullscreen", settings.fullscreen);
    }
  }

  // useSpeak
  if ("useSpeak" in settings) {
    setSetting("useSpeak", settings.useSpeak == "true" ? true : false);
  }

  // useStats
  if ("useStats" in settings) {
    setSetting("useStats", settings.useStats == "true" ? true : false);
  }

  // useEval
  if ("useEval" in settings) {
    setSetting("useEval", settings.useEval == "true" ? true : false);
  }

  // useSystemRole
  if ("useSystemRole" in settings) {
    setSetting("useSystemRole", settings.useSystemRole == "true" ? true : false);
  }

  // model
  if ("model" in settings) {
    // If user indeed set a model, not empty, use it!
    if (settings.model) {
      setSetting("model", settings.model);
    }
  }

  // functions
  if ("functions" in settings) {
    setSetting("functions", settings.functions);
  }

  // role
  if ("role" in settings) {
    setSetting("role", settings.role);
  }

  // store
  if ("stores" in settings) {
    setSetting("stores", settings.stores);
  }

  // node
  if ("node" in settings) {
    setSetting("node", settings.node);
  }

  // memLength
  if ("memLength" in settings) {
    setSetting("memLength", settings.memLength);
  }

  // passMask
  if ("passMask" in settings) {
    setSetting("passMask", settings.passMask);
  }
}

export function clearUserWebStorage() {
  localStorage.removeItem("user");
  
  // Reset session to forget previous memory
  initializeSessionMemory();

  // Reset role
  if (getSetting("role")) {
    setSetting("role", "");
  }

  // Reset store
  if (getSetting("stores")) {
    setSetting("stores", "");
  }

  // Reset node
  if (getSetting("node")) {
    setSetting("node", "");
  }
}

export function generatePassword(length=8) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function fetchUserInfo() {
  console.log("Fetching user info...");

  let user = null;
  const response = await fetch(`/api/user/info`, {
    method: "GET",
    credentials: 'include',
  });
  const data = await response.json();
  user = data.user;
  return user;
}

// User usage
// Include tokens, fees, etc.
export async function fetchUserUsage() {
  console.log("Fetching user usage...");

  let usage = null;
  const response = await fetch(`/api/user/usage`, {
    method: "GET",
    credentials: 'include',
  });
  const data = await response.json();
  usage = data.usage;
  return usage;
}

// User get user info to check user credential
export async function refreshLocalUserInfo() {
  const user = await fetchUserInfo();

  if (user) {
    console.log("User info - settings: ", JSON.stringify(user.settings, null, 2));

    // Refresh local user data
    setUserWebStorage(user);
  } else {
    console.warn("User not found or authentication failed, clearing local user data...");

    // Clear local user data
    if (getSetting("user")) {
      clearUserWebStorage();

      // Clear auth cookie
      document.cookie = "auth=; Path=/;";
      console.log("User authentication failed, local user data cleared.");
    }
  }
  return user;
}

export async function updateUserSetting(key, value) {
  console.log("Updating user setting... (key: `" + key + "`, value: `" + value + "`)");

  // There is user logged in
  // Update remote setting
  if (getSetting("user")) {
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
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}

export function getRoleLevel(role) {
  if (role === "user") return 1;
  if (role === "plus_user") return 2;
  if (role === "super_user") return 3;
  if (role === "root_user") return 4;
  return 0;
}