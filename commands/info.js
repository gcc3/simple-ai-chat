export default function info(args) {
  const info = "Session ID: " + localStorage.getItem("queryId") + "\n" +
               "Stats: " + localStorage.getItem("useStats") + "\n" +
               "Stream: " + localStorage.getItem("useStream") + "\n";

  return info;
}
