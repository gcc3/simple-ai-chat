import { attachSession } from "../utils/sessionUtils.js";

export default async function session(args) {
  if (args.length === 0) {
    return "Usage: :session attach [session_id]\n"
  }

  if (args.length === 1) {
    // :session list
    if (args[0] === "list" || args[0] === "ls") {
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
  
      if (data.result.sessions === "") {
        return "No session found.";
      } else {
        // Add new line for each log
        const sessions = data.result.sessions;
        return sessions;
      }
    }

    return "Usage: :session attach [session_id]\n"
  }

  if (args.length === 2) {
    // :session attach [session_id]
    if (args[0] === "attach") {
      return attachSession(args[1]);
    }

    // :session [del|delete] [session_id]
    if (args[0] === "del" || args[0] === "delete") {
      if (localStorage.getItem("user") === "root" || localStorage.getItem("user")) {
        const response = await fetch("/api/session/delete/" + args[1], {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }
  
        return data.result.message;
      } else {
        return "Permission denied.";
      }
    }

    return "Usage: :session attach [session_id]\n"
  }
}
