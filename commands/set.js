import { setSession, setTime } from "../utils/sessionUtils.js";
import { getSettings, getSetting, setSetting } from "../utils/settingsUtils.js";

export default function set(args) {
  const usage = "Usage: :set [key] [value]\n" +
                "       :set all\n";

  if (args.length !== 1 && args.length !== 2) {
    return usage;
  }

  if (args.length === 1) {
    if (args[0].toLowerCase() === "all") {
      const info = "Up Time (key: `_up`): " + getSetting("_up") + " (" + new Date(parseInt(getSetting("_up"))).toLocaleString() + ")\n" +
                   "Session ID (key: `session`): " + getSetting("session") + "\n" +
                   "Model (key: `model`): " + getSetting("model") + "\n" +
                   "Model Base URL (key: `baseUrl`): " + (getSetting("baseUrl") || "___") + "\n" +
                   "Timeline (key: `time`): " + getSetting("time") + "\n" +
                   "Language (key: `lang`): " + (getSetting("lang") || "___") + "\n" +
                   "Functions (key: `functions`): " + (getSetting("functions") || "___") + "\n" +
                   "Memory length (key: `memLength`, default: 7): " + getSetting("memLength") + "\n" +
                   "Role (key: `role`): " + (getSetting("role") || "___") + "\n" +
                   "Stores (key: `stores`): " + (getSetting("stores") || "___") + "\n" +
                   "Node (key: `node`): " + (getSetting("node") || "___") + "\n" +
                   "Show stats (key: `useStats`): " + getSetting("useStats") + "\n" +
                   "Use Self Evaluation (key: `useEval`): " + getSetting("useEval") + "\n" +
                   "Stream (key: `useStream`): " + getSetting("useStream") + "\n" +
                   "Speak (key: `useSpeak`): " + getSetting("useSpeak") + "\n" +
                   "Voice (key: `voice`): " + (getSetting("voice") || "default") + "\n" +
                   "Location service (key: `useLocation`): " + getSetting("useLocation") + "\n" +
                   "Location (key: `location`): " + (getSetting("location") || "___") + "\n" +
                   "Password Masking (key: `passMask`): " + getSetting("passMask") + "\n" +
                   "Use System Role (key: `useSystemRole`): " + getSetting("useSystemRole") + "\n";
      return info.trim();
    } else {
      return usage;
    }
  }

  // Key validation
  const key = args[0].toLowerCase();

  // Local keys
  let validKeys = [];

  // User settable keys
  const localKeys = getSettings("local_keys");
  for (const key of localKeys) {
    validKeys.push(key.toLowerCase());
  }

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
