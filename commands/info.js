export default function info(args) {
  const info = "Up Time (key: `_up`): " + new Date(parseInt(localStorage.getItem("_up"))).toLocaleString() + "\n" +
               "Session ID (key: `session`): " + sessionStorage.getItem("session") + "\n" +
               "Timeline (key: `time`): " + sessionStorage.getItem("time") + "\n" +
               "Language (key: `lang`): " + (localStorage.getItem("lang") || "___") + "\n" +
               "Functions (key: `functions`): " + (localStorage.getItem("functions") || "___") + "\n" +
               "Memory length (key: `memLength`, default: 7): " + sessionStorage.getItem("memLength") + "\n" +
               "Role (key: `role`): " + (sessionStorage.getItem("role") || "___") + "\n" +
               "Store (key: `store`): " + (sessionStorage.getItem("store") || "___") + "\n" +
               "Node (key: `node`): " + (sessionStorage.getItem("node") || "___") + "\n" +
               "Show stats (key: `useStats`): " + localStorage.getItem("useStats") + "\n" +
               "Use Self Evaluation (key: `useEval`): " + localStorage.getItem("useEval") + "\n" +
               "Stream (key: `useStream`): " + localStorage.getItem("useStream") + "\n" +
               "Speak (key: `useSpeak`): " + localStorage.getItem("useSpeak") + "\n" +
               "Voice (key: `voice`): " + (localStorage.getItem("voice") || "default") + "\n" +
               "Location service (key: `useLocation`): " + localStorage.getItem("useLocation") + "\n" +
               "Location (key: `location`): " + (localStorage.getItem("location") || "___") + "\n" +
               "Use System Role (key: `useSystemRole`): " + localStorage.getItem("useSystemRole") + "\n";

  return info;
}
