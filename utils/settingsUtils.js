import { generatePassword } from "utils/userUtils.js";

export function getInitialSettings(format = "json", theme = "light", fullscreen = "off") {
  let result = null;

  const initialSettings = {
    lang:          "",
    theme:         theme,
    fullscreen:    fullscreen,
    useSpeak:      "false",
    useStats:      "false",
    useEval:       "false",
    functions:     "Time,Weather,Redirection",
    role:          "",
    store:         "",
    node:          "",
    useSystemRole: "true",
    memLength:     "7",
    groupPassword: generatePassword(),
  }

  if (format === "json") {
    result = initialSettings
  }

  if (format === "json_string") {
    result = JSON.stringify(initialSettings)
  }

  return result;
}

// Setting key, default value
export function getSettings() {
  return {
     /*  1 */ lang: "",
     /*  2 */ theme: "light",
     /*  3 */ fullscreen: "off",
     /*  4 */ useSpeak: false,
     /*  5 */ useStats: false,
     /*  6 */ useEval: false,
     /*  7 */ useSystemRole: true,
     /*  8 */ functions: "Time,Weather,Redirection",
     /*  9 */ role: "",
     /* 10 */ store: "",
     /* 11 */ node: "",
     /* 12 */ memLength: 7,
  }
}