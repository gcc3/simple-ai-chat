export default function info(args) {
  const info = "Session ID: " + localStorage.getItem("queryId") + "\n" +
               "Show stats: " + localStorage.getItem("useStats") + "\n" +
               "Stream: " + localStorage.getItem("useStream") + "\n" +
               "Speak: " + localStorage.getItem("useSpeak") + "\n" +
               "Voice: " + (localStorage.getItem("voice") || "default") + "\n" +
               "Language: " + (localStorage.getItem("lang") || "en-US") + "\n" +
               "Location service: " + localStorage.getItem("useLocation") + "\n" +
               "Location: " + (localStorage.getItem("location") || "disabled") + "\n" +
               "Role: " + (localStorage.getItem("role") || "default");

  return info;
}
