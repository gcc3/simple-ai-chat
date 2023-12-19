import { attachSession } from "../utils/sessionUtils.js";

export default async function ls(args) {
  if (args.length !== 0) {
    return "Usage: :ls\n"
  }

  if (args.length === 0) {
    // :session list
    let response;
    if (localStorage.getItem("user") === "root") {
      response = await fetch("/api/session/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else if (localStorage.getItem("user")) {
      response = await fetch("/api/session/list/" + localStorage.getItem("user"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      return "Login required.";
    }

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (Object.entries(data.result.sessions).length === 0) {
      return "No session found.";
    } else {
      // Add new line for each log
      const sessions = JSON.stringify(data.result.sessions, null, 2);
      return sessions;
    }
  }
}
