import { setSession, setTime } from "utils/sessionUtils";
import { getSettings } from "utils/settingsUtils";

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
      sessionStorage.setItem("model", value);
      break;
    case "model_v":
      sessionStorage.setItem("model_v", value);
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
      localStorage.setItem("useStream", value);
      break;
    case "voice":
      localStorage.setItem("voice", value);
      break;
    case "uselocation":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useLocation", value);
      break;
    case "location":
      localStorage.setItem("location", value);
      break;
    case "lang":
      localStorage.setItem("lang", value);
      break;
    case "theme":
      if (value != "light" && value != "dark" && value != "terminal") {
        return "Invalid value. Value must be light, dark, or terminal.";
      }
      localStorage.setItem("theme", value);
      break;
    case "fullscreen":
      if (value != "off" && value != "default" && value != "split") {
        return "Invalid value. Value must be on, off, default, or split.";
      }
      localStorage.setItem("fullscreen", value);
      break;
    case "usespeak":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useSpeak", value);
      break;
    case "usestats":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useStats", value);
      break;
    case "useeval":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useEval", value);
      break;
    case "usesystemrole":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useSystemRole", value);
      break;
    case "functions":
      localStorage.setItem("functions", value);
      break;
    case "role":
      sessionStorage.setItem("role", value);
      break;
    case "stores":
      sessionStorage.setItem("stores", value);
      break;
    case "node":
      sessionStorage.setItem("node", value);
      break;
    case "memlength":
      if (isNaN(value)) {
        return "Invalid value. Value must be a number.";
      }
      sessionStorage.setItem("memLength", value);
      break;
    case "passmask":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("passMask", value);
      break;
  }

  return "Set \"" + key + "\" to \"" + value + "\".";
}
