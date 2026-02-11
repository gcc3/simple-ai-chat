
const settings = [
  { name: "Up Time",                key: "_up",            inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: Date.now(), },
  { name: "User",                   key: "user",           inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "",         },
  { name: "Language",               key: "lang",           inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "",         },
  { name: "Theme",                  key: "theme",          inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "light",    },
  { name: "Fullscreen",             key: "fullscreen",     inLocalStorage: true,    inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "off",      },
  { name: "Use Voice Speak",        key: "useSpeak",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "",         },
  { name: "Voice",                  key: "voice",          inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "default",  },
  { name: "Show stats",             key: "useStats",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "false",    },
  { name: "Use Stream",             key: "useStream",      inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "true",     },
  { name: "Use Self Evaluation",    key: "useEval",        inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "false",    },
  { name: "Use Location Service",   key: "useLocation",    inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "false",    },
  { name: "Location",               key: "location",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "",         },
  { name: "Use System Role",        key: "useSystemRole",  inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "true",     },
  { name: "Command History",        key: "history",        inLocalStorage: true,    inSessionStorage: false,  inUserSettings: false,  defaultValueIfEmpty: "[]",       },
  { name: "Password Masking",       key: "passMask",       inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "true",     },
  { name: "Functions",              key: "functions",      inLocalStorage: true,    inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "",         },
  { name: "Base URL",               key: "baseUrl",        inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",         },
  { name: "Role",                   key: "role",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "",         },
  { name: "Stores",                 key: "stores",         inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "",         },
  { name: "Node",                   key: "node",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: "",         },
  { name: "Model",                  key: "model",          inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",         },
  { name: "Session ID",             key: "session",        inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",         },
  { name: "Timeline Time",          key: "time",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",         },
  { name: "Session Head",           key: "head",           inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: "",         },
  { name: "Command History Index",  key: "historyIndex",   inLocalStorage: false,   inSessionStorage: true,   inUserSettings: false,  defaultValueIfEmpty: -1,         },
  { name: "Memory Length",          key: "memLength",      inLocalStorage: false,   inSessionStorage: true,   inUserSettings: true,   defaultValueIfEmpty: 7,          },
  { name: "Group Password",         key: "groupPassword",  inLocalStorage: false,   inSessionStorage: false,  inUserSettings: true,   defaultValueIfEmpty: "",         },
]

// Set setting in correct storage
export async function setSetting(key, value) {
  const settings = getSettings();
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
}

// Get setting from correct storage
export function getSetting(key) {
  const settings = getSettings();
  const setting = settings.find((setting) => setting.key === key);
  if (!setting) {
    console.error(`Setting with key "${key}" not found.`);
    return null;
  }

  let value = null;
  if (setting.inLocalStorage) {
    value = localStorage.getItem(key);
  }

  // If both storages are used (e.g., fullscreen), sessionStorage takes precedence
  if (setting.inSessionStorage) {
    value = sessionStorage.getItem(key);
  }
  return value;
}

export function isSettingEmpty(key) {
  const settings = getSettings();
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
  const settings = getSettings();

  // Loop through settings and set localStorage and sessionStorage values
  settings.forEach((setting) => {
    if (setting.inLocalStorage) {
      if (localStorage.getItem(setting.key) === null) {
        localStorage.setItem(setting.key, setting.defaultValueIfEmpty);
      }
    }
    if (setting.inSessionStorage) {
      // For CLI it using sessionStorage library will return undefined, so the undefined check is necessary
      if (sessionStorage.getItem(setting.key) === null
       || sessionStorage.getItem(setting.key) === undefined) {
        sessionStorage.setItem(setting.key, setting.defaultValueIfEmpty);
      }
    }
  });
}

// Setting key, default value
export function getSettings(format = "list") {
  // Full setting list (default)
  if (format === "list") {
    return settings;
  }

  // Local storage or session storage
  if (format === "local_keys") {
    let localSettings = [];
    for (const setting of settings) {
      if (setting.inLocalStorage || setting.inSessionStorage) {
        localSettings.push(setting.key);
      }
    }
    return localSettings;
  }

  if (format === "user_keys") {
    let userSettings = [];
    for (const setting of settings) {
      if (setting.inUserSettings) {
        userSettings.push(setting.key);
      }
    }
    return userSettings;
  }

  if (format === "user_default") {
    let userSettings = {};
    for (const setting of settings) {
      if (setting.inUserSettings) {
        userSettings[setting.key] = setting.defaultValueIfEmpty;
      }
    }
    return userSettings;
  }

  return null;
}

// Get default setting
export function getDefaultSetting(key) {
  const setting = settings.find((s) => s.key === key);
  if (setting) {
    return setting.defaultValueIfEmpty;
  }
  return null;
}
