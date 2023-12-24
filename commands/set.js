export default function set(args) {
  if (args.length != 2) {
    return "Usage: :set [key] [value]";
  }

  if (args[1].startsWith("\"") && args[1].endsWith("\"")) {
    return "Value must not be quoted.";
  }

  const key = args[0].toLowerCase();
  const value = args[1].split("\"")[1].split("\"")[0];

  switch (key) {
    case "session":
      sessionStorage.setItem("session", value);
      break;
    case "time":
      sessionStorage.setItem("time", value);
      break;
    case "memlength":
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
    case "showstats":
      localStorage.setItem("useStats", value);
      break;
    case "stream":
      localStorage.setItem("useStream", value);
      break;
    case "speak":
      localStorage.setItem("useSpeak", value);
      break;
    case "voice":
      localStorage.setItem("voice", value);
      break;
    case "lang":
      localStorage.setItem("lang", value);
      break;
    case "locationservice":
      localStorage.setItem("useLocation", value);
      break;
    case "location":
      localStorage.setItem("location", value);
      break;
    default:
      return "Unknown key: " + key + ", key must be one of: session, time, memLength, role, store, node, showStats, stream, speak, voice, lang, locationService, location";
  }
}
