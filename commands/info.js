export default function info(args) {
  const info = "Session ID: " + sessionStorage.getItem("queryId") + "\n" +
               "Timeline: " + sessionStorage.getItem("time") + "\n" +
               "Role: " + (sessionStorage.getItem("role") || "(not set)") + "\n" +
               "Store: " + (localStorage.getItem("store") || "(not set)") + "\n" +
               "Show stats: " + localStorage.getItem("useStats") + "\n" +
               "Stream: " + localStorage.getItem("useStream") + "\n" +
               "Speak: " + localStorage.getItem("useSpeak") + "\n" +
               "Voice: " + (localStorage.getItem("voice") || "default") + "\n" +
               "Language: " + (localStorage.getItem("lang") || "en-US") + "\n" +
               "Location service: " + localStorage.getItem("useLocation") + "\n" +
               "Location: " + (localStorage.getItem("location") || "(disabled)") + "\n";

  return info;
}
