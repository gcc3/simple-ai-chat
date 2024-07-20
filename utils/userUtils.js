import { setTheme } from "./themeUtils";
import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';
import { initializeSession } from "./sessionUtils";

export function setUserLocalStorage(user) {
  // 1. Set local user
  localStorage.setItem("user", user.username);

  // 2. Overwrite local settings
  if (user.settings) {
    const settings = user.settings;

    // lang
    if (settings.lang) {
      localStorage.setItem("lang", settings.lang);
    }

    // theme
    if (settings.theme) {
      localStorage.setItem("theme", settings.theme);
      setTheme(localStorage.getItem("theme"));
    }

    // fullscreen
    if (settings.fullscreen) {
      if (settings.fullscreen != localStorage.getItem("fullscreen") && !localStorage.getItem("fullscreen").includes("force")) {
        localStorage.setItem("fullscreen", settings.fullscreen);
        store.dispatch(toggleFullscreen(settings.fullscreen));
      }
    }

    // useSpeak
    if (settings.useSpeak) {
      localStorage.setItem("useSpeak", settings.useSpeak == "true" ? true : false);
    }

    // useStats
    if (settings.useStats) {
      localStorage.setItem("useStats", settings.useStats == "true" ? true : false);
    }

    // useEval
    if (settings.useEval) {
      localStorage.setItem("useEval", settings.useEval == "true" ? true : false);
    }

    // useSystemRole
    if (settings.useSystemRole) {
      localStorage.setItem("useSystemRole", settings.useSystemRole == "true" ? true : false);
    }

    // functions
    if (settings.functions) {
      localStorage.setItem("functions", settings.functions);
    }

    // role
    if (settings.role) {
      sessionStorage.setItem("role", settings.role);
    }

    // store
    if (settings.store) {
      sessionStorage.setItem("store", settings.store);
    }

    // node
    if (settings.node) {
      sessionStorage.setItem("node", settings.node);
    }

    // memLength
    if (settings.memLength) {
      sessionStorage.setItem("memLength", settings.memLength);
    }

    // passMask
    if (settings.passMask) {
      localStorage.setItem("passMask", settings.passMask);
    }
  }
}

export function clearUserWebStorage() {
  localStorage.removeItem("user");
  
  // Reset session to forget previous memory
  initializeSession();

  // Reset role
  if (sessionStorage.getItem("role")) {
    sessionStorage.setItem("role", "");
  }

  // Reset store
  if (sessionStorage.getItem("store")) {
    sessionStorage.setItem("store", "");
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

// Basic user info
export async function getUserInfo() {
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
export async function getUserUsage() {
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
export async function refreshUserInfo() {
  const user = await getUserInfo();

  if (user) {
    // Refresh local user data
    setUserLocalStorage(user);
  } else {
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
  console.log("Updating user setting...");

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