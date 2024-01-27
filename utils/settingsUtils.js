import { generatePassword } from "utils/userUtils.js";

export function getInitialSettings(format = "json") {
  getSettings(format);
}

// Setting key, default value
export function getSettings(format = "json", theme = "light", fullscreen = "off") {
  let result = null;

  // Settings with default value
  const settings = {
    /*  1 */ lang:          "",
    /*  2 */ theme:         theme,
    /*  3 */ fullscreen:    fullscreen,
    /*  4 */ useSpeak:      false,
    /*  5 */ useStats:      false,
    /*  6 */ useEval:       false,
    /*  7 */ useSystemRole: true,
    /*  8 */ functions:     "Time,Weather,Redirection",
    /*  9 */ role:          "",
    /* 10 */ store:         "",
    /* 11 */ node:          "",
    /* 12 */ memLength:     7,
    /* 13 */ passMask:      true,
    /* 14 */ groupPassword: generatePassword(),
  }

  if (format === "json") {
    result = settings
  }

  if (format === "json_string") {
    result = JSON.stringify(settings)
  }

  if (format === "keys_array") {
    result = Object.entries(settings)
  }

  if (format === "keys_string_array") {
    result = Object.keys(settings).map(key => String(key));
  }

  if (format === "full_array") {
    result = [
      { name: "Up Time",               key: "_up",           storage: "localStorage",    userSettings: "",               default: "",                         description: "" },
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
      { name: "Use System Role",       key: "useSystemRole", storage: "localStorage",    userSettings: "",               default: "true",                     description: "" },
      { name: "Functions",             key: "functions",     storage: "localStorage",    userSettings: "functions",      default: "Time,Weather,Redirection", description: "" },
      { name: "Session ID",            key: "session",       storage: "sessionStorage",  userSettings: "",               default: "",                         description: "" },
      { name: "Session Head",          key: "head",          storage: "sessionStorage",  userSettings: "",               default: "",                         description: "" },
      { name: "Command History",       key: "history",       storage: "sessionStorage",  userSettings: "",               default: "[]",                       description: "" },
      { name: "Command Hostory Index", key: "historyIndex",  storage: "sessionStorage",  userSettings: "",               default: "-1",                       description: "" },
      { name: "Role",                  key: "role",          storage: "sessionStorage",  userSettings: "role",           default: "",                         description: "" },
      { name: "Store",                 key: "store",         storage: "sessionStorage",  userSettings: "store",          default: "",                         description: "" },
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
