import { getSetting } from "../utils/settingsUtils.js";


export default function info(args) {
  const info = "Up Time (key: `_up`): " + getSetting("_up") + " (" 
                                        + new Date(parseInt(getSetting("_up"))).toLocaleString() + ")\n" +
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

  return info;
}
