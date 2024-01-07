export default function info(args) {
  const info = "Session ID (key: `session`): " + sessionStorage.getItem("session") + "\n" +
               "Timeline (key: `time`): " + sessionStorage.getItem("time") + "\n" +
               "Memory length (key: `memLength`, default: 7): " + sessionStorage.getItem("memLength") + "\n" +
               "Role (key: `role`): " + (sessionStorage.getItem("role") || "(not set)") + "\n" +
               "Store (key: `store`): " + (sessionStorage.getItem("store") || "(not set)") + "\n" +
               "Node (key: `node`): " + (sessionStorage.getItem("node") || "(not set)") + "\n" +
               "Show stats (key: `useStats`): " + localStorage.getItem("useStats") + "\n" +
               "Stream (key: `useStream`): " + localStorage.getItem("useStream") + "\n" +
               "Speak (key: `useSpeak`): " + localStorage.getItem("useSpeak") + "\n" +
               "Voice (key: `voice`): " + (localStorage.getItem("voice") || "default") + "\n" +
               "Language (key: `lang`): " + (localStorage.getItem("lang") || "en-US") + "\n" +
               "Location service (key: `useLocation`): " + localStorage.getItem("useLocation") + "\n" +
               "Location (key: `location`): " + (localStorage.getItem("location") || "(not set)") + "\n";

  return info;
}
