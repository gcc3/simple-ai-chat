import { setTheme } from "./themeUtils";
import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';

export function setUserLocalStorage(user) {
  localStorage.setItem("user", user.username);
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userRole", user.role);
  localStorage.setItem("userSettings", user.settings);

  if (user.settings) {
    const settings = user.settings;

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

    if (settings.fullscreen) {
      localStorage.setItem("fullscreen", settings.fullscreen);
      store.dispatch(toggleFullscreen(settings.fullscreen));
    }
  }
}

export function clearUserLocalStorage() {
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userSettings");
  
  // Reset query id to forget previous memory
  localStorage.setItem("time", Date.now());
  localStorage.setItem("queryId", Date.now());

  // Reset role
  if (localStorage.getItem("role")) {
    localStorage.setItem("role", "");
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
      clearUserLocalStorage();

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
