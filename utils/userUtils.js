import { setTheme } from "./themeUtils";
import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';
import { initializeSession } from "./sessionUtils";

export function setUserLocalStorage(user) {
  localStorage.setItem("user", user.username);
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userRole", user.role);

  if (user.settings) {
    const settings = user.settings;

    // 1. lang
    if (settings.lang) {
      localStorage.setItem("lang", settings.lang);
    }

    // 2. theme
    if (settings.theme) {
      localStorage.setItem("theme", settings.theme);
      setTheme(localStorage.getItem("theme"));
    }

    // 3. fullscreen
    // If fullscreen is forced, do not overwrite
    if (settings.fullscreen && localStorage.getItem("fullscreen").indexOf("force") === -1) {
      localStorage.setItem("fullscreen", settings.fullscreen);
      store.dispatch(toggleFullscreen(settings.fullscreen));
    }

    // 4. useSpeak
    if (settings.useSpeak) {
      localStorage.setItem("useSpeak", settings.useSpeak == "true" ? "true" : "false");
    }

    // 5. useStats
    if (settings.useStats) {
      localStorage.setItem("useStats", settings.useStats == "true" ? "true" : "false");
    }

    // 6. useEval
    if (settings.useEval) {
      localStorage.setItem("useEval", settings.useEval == "true" ? "true" : "false");
    }

    // 7. useSystemRole
    if (settings.useSystemRole) {
      sessionStorage.setItem("useSystemRole", settings.useSystemRole == "true" ? "true" : "false");
    }

    // 8. functions
    if (settings.functions) {
      localStorage.setItem("functions", settings.functions);
    }

    // 9. role
    sessionStorage.setItem("role", settings.role);

    // 10. store
    sessionStorage.setItem("store", settings.store);

    // 11. node
    sessionStorage.setItem("node", settings.node);

    // 12. memLength
    sessionStorage.setItem("memLength", settings.memLength);
  }
}

export function clearUserWebStorage() {
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userSettings");
  
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

// User get user info to check user credential
export async function refreshUserInfo() {
  let user = null;
  const response = await fetch(`/api/user/info`, {
    method: "GET",
    credentials: 'include',
  });
  const data = await response.json();
  user = data.user;

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