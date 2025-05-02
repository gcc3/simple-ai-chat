import { setTheme } from "./themeUtils";
import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';
import { initializeSessionMemory } from "./sessionUtils";

export function setUserWebStorage(user) {
  if (!user.username || !user.settings) {
    console.warn("User data is incomplete, clearing local user data...");

    // Clear local user data
    if (localStorage.getItem("user")) {
      clearUserWebStorage();

      // Clear auth cookie
      document.cookie = "auth=; Path=/;";
      console.log("User data is incomplete, local user data cleared.");
    }
    return;
  }

  // 1. Set local user
  localStorage.setItem("user", user.username);

  // 2. Overwrite local settings
  const settings = user.settings;

  // lang
  if ("lang" in settings) {
    localStorage.setItem("lang", settings.lang);
  }

  // theme
  if ("theme" in settings) {
    localStorage.setItem("theme", settings.theme);
    setTheme(localStorage.getItem("theme"));
  }

  // fullscreen
  if ("fullscreen" in settings) {
    if (settings.fullscreen != localStorage.getItem("fullscreen") && !localStorage.getItem("fullscreen").includes("force")) {
      localStorage.setItem("fullscreen", settings.fullscreen);
      store.dispatch(toggleFullscreen(settings.fullscreen));
    }
  }

  // useSpeak
  if ("useSpeak" in settings) {
    localStorage.setItem("useSpeak", settings.useSpeak == "true" ? true : false);
  }

  // useStats
  if ("useStats" in settings) {
    localStorage.setItem("useStats", settings.useStats == "true" ? true : false);
  }

  // useEval
  if ("useEval" in settings) {
    localStorage.setItem("useEval", settings.useEval == "true" ? true : false);
  }

  // useSystemRole
  if ("useSystemRole" in settings) {
    localStorage.setItem("useSystemRole", settings.useSystemRole == "true" ? true : false);
  }

  // model
  if ("model" in settings) {
    if (settings.model) {
      sessionStorage.setItem("model", settings.model);
    } else {
      // Model is empty, use default
      sessionStorage.setItem("model", global.model);
      sessionStorage.setItem("baseUrl", global.baseUrl);
    }
  }

  // functions
  if ("functions" in settings) {
    localStorage.setItem("functions", settings.functions);
  }

  // role
  if ("role" in settings) {
    sessionStorage.setItem("role", settings.role);
  }

  // store
  if ("stores" in settings) {
    sessionStorage.setItem("stores", settings.stores);
  }

  // node
  if ("node" in settings) {
    sessionStorage.setItem("node", settings.node);
  }

  // memLength
  if ("memLength" in settings) {
    sessionStorage.setItem("memLength", settings.memLength);
  }

  // passMask
  if ("passMask" in settings) {
    localStorage.setItem("passMask", settings.passMask);
  }
}

export function clearUserWebStorage() {
  localStorage.removeItem("user");
  
  // Reset session to forget previous memory
  initializeSessionMemory();

  // Reset role
  if (sessionStorage.getItem("role")) {
    sessionStorage.setItem("role", "");
  }

  // Reset store
  if (sessionStorage.getItem("stores")) {
    sessionStorage.setItem("stores", "");
  }

  // Reset node
  if (sessionStorage.getItem("node")) {
    sessionStorage.setItem("node", "");
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
    if (localStorage.getItem("user")) {
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
  if (localStorage.getItem("user")) {
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
  if (role === "pro_user") return 2;
  if (role === "super_user") return 3;
  if (role === "root_user") return 4;
  return 0;
}