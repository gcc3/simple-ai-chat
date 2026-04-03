import { setTheme } from "./themeUtils.js";
import { initializeSessionMemory } from "./sessionUtils.js";
import { getSetting, setSetting } from "./settingsUtils.js";
import emitter from './eventsUtils.js';


export async function refreshLocalUser(user = null) {
  if (!user) {
    console.log("Fetching user info...");
    user = await fetchUserInfo();
  }

  if (!user || !user.username || !user.settings) {
    console.warn("User data is incomplete, clearing local user data...");

    // Clear local user data
    if (getSetting("user")) {
      clearLocalUser();

      // Clear auth cookie
      document.cookie = "auth=; Path=/;";
      console.log("User data is incomplete, local user data cleared.");
    }
    return;
  }

  console.log("User info:", JSON.stringify(user, null, 2));

  // 1. Set local user
  setSetting("user", user.username);

  // 2. Overwrite local settings
  const settings = user.settings;

  // lang
  // If set, override with user setting
  if ("lang" in settings && settings.lang) {
    setSetting("lang", settings.lang);
  }

  // theme
  // If set, override with user setting
  if ("theme" in settings && settings.theme) {
    setSetting("theme", settings.theme);

    // Trigger the theme change
    setTheme(getSetting("theme"));
  }

  // fullscreen
  if ("fullscreen" in settings) {
    if (getSetting("fullscreen") !== settings.fullscreen) {
      setSetting("fullscreen", settings.fullscreen);

      // Trigger the fullscreen event
      emitter.emit("ui:set_fullscreen", settings.fullscreen);
    }
  }

  // useSpeak
  // If set, override with user setting
  if ("useSpeak" in settings && settings.useSpeak) {
    setSetting("useSpeak", settings.useSpeak == "true" ? true : false);
  }

  // useStats
  // If set, override with user setting
  if ("useStats" in settings && settings.useStats) {
    setSetting("useStats", settings.useStats == "true" ? true : false);
  }

  // useEval
  // If set, override with user setting
  if ("useEval" in settings && settings.useEval) {
    setSetting("useEval", settings.useEval == "true" ? true : false);
  }

  // useSystemRole
  // If set, override with user setting
  if ("useSystemRole" in settings && settings.useSystemRole) {
    setSetting("useSystemRole", settings.useSystemRole == "true" ? true : false);
  }

  // model
  // If set, override with user setting
  if ("model" in settings && settings.model) {
    setSetting("model", settings.model);
  }

  // functions
  // Override with user setting
  if ("functions" in settings) {
    setSetting("functions", settings.functions);
  }

  // role
  // Override with user setting
  if ("role" in settings) {
    setSetting("role", settings.role);
  }

  // store
  // Override with user setting
  if ("stores" in settings) {
    setSetting("stores", settings.stores);
  }

  // node
  // Override with user setting
  if ("node" in settings) {
    setSetting("node", settings.node);
  }

  // memLength
  // Override with user setting
  if ("memLength" in settings) {
    setSetting("memLength", settings.memLength);
  }

  // passMask
  // If set, override with user setting
  if ("passMask" in settings && settings.passMask) {
    setSetting("passMask", settings.passMask);
  }
}

export function clearLocalUser() {
  localStorage.setItem("user", "");

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

export async function updateUserSetting(key, value) {
  // Check user logged in
  if (getSetting("user")) {
    console.log(value ? "Updating user setting, key: `" + key + "`, value: `" + value + "`" : "Reseting user setting `" + key + "` to default");

    // Update remote setting
    try {
      const response = await fetch("/api/user/update/setting", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: key,
          value: value,  // value can be undefined, and will not be sent to server.
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error
      }
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
