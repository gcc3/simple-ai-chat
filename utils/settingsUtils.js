import { generatePassword } from "./userUtils.js";


// Set setting in correct storage
export async function setSetting(key, value) {
  const settings = getSettings("list");
  const setting = settings.find((setting) => setting.key === key);
  if (!setting) {
    console.error(`Setting with key "${key}" not found.`);
    return;
  }

  if (setting.inLocalStorage) {
    localStorage.setItem(key, value);
  }
  
  if (setting.inSessionStorage) {
    sessionStorage.setItem(key, value);
  }
  
  if (!isSettingEmpty("user") && setting.inUserSettings) {
    await updateUserSetting(key, value);
  }
}

// Get setting from correct storage
export function getSetting(key) {
  const settings = getSettings("list");
  const setting = settings.find((setting) => setting.key === key);
  if (!setting) {
    console.error(`Setting with key "${key}" not found.`);
    return null;
  }

  let value = null;
  if (setting.inLocalStorage) {
    value = localStorage.getItem(key);
  }
  if (setting.inSessionStorage) {
    value = sessionStorage.getItem(key);
  }
  return value;
}

export function isSettingEmpty(key) {
  const settings = getSettings("list");
  const setting = settings.find((setting) => setting.key === key);
  if (!setting) {
    console.error(`Setting with key "${key}" not found.`);
    return null;
  }

  let value = null;
  if (setting.inLocalStorage) {
    value = localStorage.getItem(key);
  }
  if (setting.inSessionStorage) {
    value = sessionStorage.getItem(key);
  }
  return value === null || value === "";
}


export function initializeSettings() {
  const settings = getSettings("list");

  // Loop through settings and set localStorage and sessionStorage values
  settings.forEach((setting) => {
    if (setting.inLocalStorage) {
      if (localStorage.getItem(setting.key) === null) {
        localStorage.setItem(setting.key, setting.defaultValueIfEmpty);
      }
    }
    if (setting.inSessionStorage) {
      if (sessionStorage.getItem(setting.key) === null) {
        sessionStorage.setItem(setting.key, setting.defaultValueIfEmpty);
      }
    }
  });
}

// Setting key, default value
export function getSettings(format = "json", theme = "light", fullscreen = "off") {
  let result = null;

  if (format === "list") {
    return [
      { name: "Up Time",                key: "_up",            inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: Date.now(),                             },
      { name: "User",                   key: "user",           inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "",                                     },
      { name: "Language",               key: "lang",           inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "",                                     },
      { name: "Theme",                  key: "theme",          inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "light",                                },
      { name: "Fullscreen",             key: "fullscreen",     inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "off",                                  },
      { name: "Use Voice Speak",        key: "useSpeak",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "false",                                },
      { name: "Voice",                  key: "voice",          inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "default",                              },
      { name: "Show stats",             key: "useStats",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "false",                                },
      { name: "Use Stream",             key: "useStream",      inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "true",                                 },
      { name: "Use Self Evaluation",    key: "useEval",        inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "false",                                },
      { name: "Use Location Service",   key: "useLocation",    inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "false",                                },
      { name: "Location",               key: "location",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "",                                     },
      { name: "Use System Role",        key: "useSystemRole",  inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "true",                                 },
      { name: "Command History",        key: "history",        inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "[]",                                   },
      { name: "Password Masking",       key: "passMask",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "true",                                 },
      { name: "Functions",              key: "functions",      inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "get_time,get_weather,redirect_to_url", },
      { name: "Base URL",               key: "baseUrl",        inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",                                     },
      { name: "Role",                   key: "role",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "",                                     },
      { name: "Stores",                 key: "stores",         inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "",                                     },
      { name: "Node",                   key: "node",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "",                                     },
      { name: "Model",                  key: "model",          inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",                                     },
      { name: "Session ID",             key: "session",        inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",                                     },
      { name: "Timeline Time",          key: "time",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",                                     },
      { name: "Session Head",           key: "head",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",                                     },
      { name: "Command History Index",  key: "historyIndex",   inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "-1",                                   },
      { name: "Memory Length",          key: "memLength",      inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "7",                                    },
      { name: "Group Password",         key: "groupPassword",  inLocalStorage: false,   inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "",                                     },
    ];
  }

  const localSettings = {
    _up: "",
    model: "",
    user: "",
    userRole: "",
    time: "",
    lang: "",
    theme: "",
    fullscreen: "",
    useSpeak: "",
    useStats: "",
    useStream: "",
    useEval: "",
    useSystemRole: "",
    functions: "",
    session: "",
    head: "",
    history: "",
    historyIndex: "",
    role: "",
    stores: "",
    node: "",
    memLength: "",
    passMask: "",
    voice: "",
    useStream: "",
    useLocation: "",
    location: "",
  }

  if (format === "keys_string_array_local") {
    result = Object.keys(localSettings).map(key => String(key));
  }

  // Settings with default value
  const userSettings = {
    lang:          "",
    theme:         theme,
    fullscreen:    fullscreen,
    useSpeak:      false,
    useStats:      false,
    useEval:       false,
    useSystemRole: true,
    model:         "",
    functions:     "get_time,get_weather,redirect_to_url",
    role:          "",
    stores:        "",
    node:          "",
    memLength:     7,
    passMask:      true,
    groupPassword: generatePassword(),
  }

  if (format === "json") {
    result = userSettings
  }

  if (format === "json_string") {
    result = JSON.stringify(userSettings)
  }

  if (format === "keys_array") {
    result = Object.entries(userSettings)
  }

  if (format === "keys_string_array_user") {
    result = Object.keys(userSettings).map(key => String(key));
  }

  return result;
}
