import { generatePassword } from "utils/userUtils.js";

export function getInitialSettings() {
  getSettings(format);
}

// Setting key, default value
export function getSettings(format = "json", theme = "light", fullscreen = "off") {
  let result = null;

  // Settings with default value
  const initialSettings = {
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
    /* 13 */ groupPassword: generatePassword(),
  }

  if (format === "json") {
    result = initialSettings
  }

  if (format === "json_string") {
    result = JSON.stringify(initialSettings)
  }

  if (format === "keys_array") {
    result = Object.entries(initialSettings)
  }

  if (format === "keys_string_array") {
    result = Object.keys(initialSettings).map(key => String(key));
  }

  return result;
}