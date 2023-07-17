export default function info(args) {
  const info = "Session ID: " + localStorage.getItem("queryId") + "\n" +
               "Show Stats: " + localStorage.getItem("useStats") + "\n" +
               "Stream: " + localStorage.getItem("useStream") + "\n" +
               "Speak: " + localStorage.getItem("useSpeak") + "\n" +
               "Language: " + (localStorage.getItem("lang") || "en") + "\n" +
               "Location: " + localStorage.getItem("useLocation") + "\n" +
               "Role: " + (localStorage.getItem("role") || "default");

  return info;
}
