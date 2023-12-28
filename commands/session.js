import { attachSession } from "../utils/sessionUtils.js";

export default async function session(args) {
  const usage = "Usage: :session [list|ls]\n" +
                "       :session attach [session_id]\n";

  const command = args[0];
  if (args.length === 0) {
    return usage;
  }
  
  // :session list
  if (command === "list" || command === "ls") {
    if (args.length !== 1) {
      return "Usage: :session [list|ls]\n"
    }

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

  // :session attach [session_id]
  if (command === "attach") {
    if (args.length !== 2) {
      return "Usage: :session attach [session_id]\n"
    }

    return attachSession(args[1]);
  }
}
