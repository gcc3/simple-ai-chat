import { setSession, setTime } from "../utils/sessionUtils.js";
import { getSettings, setSetting } from "../utils/settingsUtils.js";

export default function set(args) {
  if (args.length != 2) {
    return "Usage: :set [key] [value]";
  }

  // Key validation
  const key = args[0].toLowerCase();

  // Local keys
  let validKeys = [
    "session",
    "time",
    "usestream",
    "voice",
    "uselocation",
    "location",
  ];

  // User settable keys
  const availableSettings = getSettings();
  for (const [k, v] of Object.entries(availableSettings)) {
    validKeys.push(k.toLowerCase());
  }

  console.log(key);
  console.log(validKeys);
  if (!validKeys.includes(key)) {
    return "Unknown key. Key must be one of: " + validKeys.join(", ") + ".";
  }

  // Value validation
  let value = args[1].toLowerCase();
  if (args[1].startsWith("\"") && args[1].endsWith("\"")) {
    value = args[1].slice(1, -1);
  }

  console.log("Set \"" + key + "\" to \"" + value + "\".");
  switch (key) {
    case "session":
      if (isNaN(value)) {
        return "Invalid value. Value must be a number.";
      }
      setSession(value);
      break;
    case "model":
      setSetting("model", value);
      break;
    case "time":
      if (isNaN(value)) {
        return "Invalid value. Value must be a number.";
      }
      setTime(value);
      break;
    case "usestream":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      setSetting("useStream", value);
      break;
    case "voice":
      setSetting("voice", value);
      break;
    case "uselocation":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      setSetting("useLocation", value);
      break;
    case "location":
      setSetting("location", value);
      break;
    case "lang":
      setSetting("lang", value);
      break;
    case "theme":
      if (value != "light" && value != "dark" && value != "terminal") {
        return "Invalid value. Value must be light, dark, or terminal.";
      }
      setSetting("theme", value);
      break;
    case "fullscreen":
      if (value != "off" && value != "default" && value != "split") {
        return "Invalid value. Value must be on, off, default, or split.";
      }
      setSetting("fullscreen", value);
      break;
    case "usespeak":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      setSetting("useSpeak", value);
      break;
    case "usestats":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      setSetting("useStats", value);
      break;
    case "useeval":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      setSetting("useEval", value);
      break;
    case "usesystemrole":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      setSetting("useSystemRole", value);
      break;
    case "functions":
      setSetting("functions", value);
      break;
    case "role":
      setSetting("role", value);
      break;
    case "stores":
      setSetting("stores", value);
      break;
    case "node":
      setSetting("node", value);
      break;
    case "memlength":
      if (isNaN(value)) {
        return "Invalid value. Value must be a number.";
      }
      setSetting("memLength", value);
      break;
    case "passmask":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      setSetting("passMask", value);
      break;
  }

  return "Set \"" + key + "\" to \"" + value + "\".";
}
