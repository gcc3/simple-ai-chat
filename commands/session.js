import { attachSession } from "../utils/sessionUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function session(args) {
  const usage = "Usage: :session [list|ls]\n" +
                "       :session attach [session_id]\n";

  const command = args[0];

  if (args.length === 0) {
    if (getSetting("session") === "" || getSetting("session") === null) {
      return "No session attached.";
    }

    // Get session
    const response = await fetch("/api/session/" + getSetting("session"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (response.status !== 200) {
      return data.error || new Error(`Request failed with status ${response.status}`);
    }

    const session = data.result.session;
    if (session) {
      return JSON.stringify(session, null, 2);
    } else {
      return "Not found.\n";
    }
  }
  
  // :session list
  if (command === "list" || command === "ls") {
    if (args.length !== 1) {
      return "Usage: :session [list|ls]\n"
    }

    let response;
    if (getSetting("user") === "root") {
      response = await fetch("/api/session/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else if (getSetting("user")) {
      response = await fetch("/api/session/list/" + getSetting("user"), {
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

  return usage;
}
