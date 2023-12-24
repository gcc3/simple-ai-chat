export default function set(args) {
  if (args.length != 2) {
    return "Usage: :set [key] [value]";
  }

  // Key validation
  const key = args[0].toLowerCase();
  const validKeys = [
    "session",
    "time",
    "memlength",
    "role",
    "store",
    "node",
    "showstats",
    "stream",
    "speak",
    "voice",
    "lang",
    "locationservice",
    "location"
  ];

  if (!validKeys.includes(key)) {
    return "Unknown key. Key must be one of: session, time, memLength, role, store, node, showStats, stream, speak, voice, lang, locationService, location";
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
      sessionStorage.setItem("session", value);
      break;
    case "time":
      if (isNaN(value)) {
        return "Invalid value. Value must be a number.";
      }
      sessionStorage.setItem("time", value);
      break;
    case "memlength":
      if (isNaN(value)) {
        return "Invalid value. Value must be a number.";
      }
      sessionStorage.setItem("memLength", value);
      break;
    case "role":
      sessionStorage.setItem("role", value);
      break;
    case "store":
      sessionStorage.setItem("store", value);
      break;
    case "node":
      sessionStorage.setItem("node", value);
      break;
    case "useStats":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useStats", value);
      break;
    case "useStream":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useStream", value);
      break;
    case "useSpeak":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useSpeak", value);
      break;
    case "voice":
      localStorage.setItem("voice", value);
      break;
    case "lang":
      localStorage.setItem("lang", value);
      break;
    case "useLocation":
      if (value != "true" && value != "false") {
        return "Invalid value. Value must be true or false.";
      }
      localStorage.setItem("useLocation", value);
      break;
    case "location":
      localStorage.setItem("location", value);
      break;
  }

  return "Set \"" + key + "\" to \"" + value + "\".";
}
