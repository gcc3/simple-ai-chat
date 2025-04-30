import { generatePassword } from "utils/userUtils.js";

// Setting key, default value
export function getSettings(format = "json", theme = "light", fullscreen = "off") {
  let result = null;

  const localSettings = {
    _up: "",
    model: "",
    model_v: "",
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
    model_v:       "",
    functions:     "Time,Weather,Redirection",
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

  if (format === "full_array") {
    result = [
      { name: "Up Time",               key: "_up",           storage: "localStorage",    userSettings: "",               default: "",                         description: "" },
      { name: "Model",                 key: "model",         storage: "sessionStorage",  userSettings: "",               default: "",                         description: "" },
      { name: "Model Version",         key: "model_v",       storage: "sessionStorage",  userSettings: "",               default: "",                         description: "" },
      { name: "User",                  key: "user",          storage: "localStorage",    userSettings: "",               default: "",                         description: "" },
      { name: "User Role",             key: "userRole",      storage: "localStorage",    userSettings: "",               default: "",                         description: "" },
      { name: "Timeline",              key: "time",          storage: "sessionStorage",  userSettings: "",               default: "",                         description: "" },
      { name: "Language",              key: "lang",          storage: "localStorage",    userSettings: "lang",           default: "en-US",                    description: "" },
      { name: "Theme",                 key: "theme",         storage: "localStorage",    userSettings: "theme",          default: "light",                    description: "" },
      { name: "Fullscreen",            key: "fullscreen",    storage: "localStorage",    userSettings: "fullscreen",     default: "off",                      description: "" },
      { name: "Use Voice Speak",       key: "useSpeak",      storage: "lcoalStorage",    userSettings: "useSpeak",       default: "false",                    description: "" },
      { name: "Show stats",            key: "useStats",      storage: "localStorage",    userSettings: "",               default: "false",                    description: "" },
      { name: "Use Stream",            key: "useStream",     storage: "localStorage",    userSettings: "",               default: "true",                     description: "" },
      { name: "Use Self Evaluation",   key: "useEval",       storage: "localStorage",    userSettings: "useEval",        default: "false",                    description: "" },
      { name: "Use System Role",       key: "useSystemRole", storage: "localStorage",    userSettings: "useSystemRole",  default: "true",                     description: "" },
      { name: "Functions",             key: "functions",     storage: "localStorage",    userSettings: "functions",      default: "Time,Weather,Redirection", description: "" },
      { name: "Session ID",            key: "session",       storage: "sessionStorage",  userSettings: "",               default: "",                         description: "" },
      { name: "Session Head",          key: "head",          storage: "sessionStorage",  userSettings: "",               default: "",                         description: "" },
      { name: "Command History",       key: "history",       storage: "localStorage",    userSettings: "",               default: "[]",                       description: "" },
      { name: "Command Hostory Index", key: "historyIndex",  storage: "sessionStorage",  userSettings: "",               default: "-1",                       description: "" },
      { name: "Role",                  key: "role",          storage: "sessionStorage",  userSettings: "role",           default: "",                         description: "" },
      { name: "Stores",                key: "stores",        storage: "sessionStorage",  userSettings: "stores",         default: "",                         description: "" },
      { name: "Node",                  key: "node",          storage: "sessionStorage",  userSettings: "node",           default: "",                         description: "" },
      { name: "Memory Length",         key: "memLength",     storage: "sessionStorage",  userSettings: "memLength",      default: "7",                        description: "" },
      { name: "Password Masking",      key: "passMask",      storage: "localStorage",    userSettings: "passMask",       default: "true",                     description: "" },
      { name: "Group Password",        key: "groupPassword", storage: "",                userSettings: "groupPassword",  default: "",                         description: "" },
      { name: "Voice",                 key: "voice",         storage: "localStorage",    userSettings: "",               default: "default",                  description: "" },
      { name: "Stream",                key: "useStream",     storage: "localStorage",    userSettings: "",               default: "true",                     description: "" },
      { name: "Location Service",      key: "useLocation",   storage: "localStorage",    userSettings: "",               default: "false",                    description: "" },
      { name: "Location",              key: "location",      storage: "localStorage",    userSettings: "",               default: "",                         description: "" },
    ];
  }

  return result;
}
