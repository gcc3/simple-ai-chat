import { attachSession } from "../utils/sessionUtils.js";

export default function session(args) {
  if (args.length === 0) {
    return "Usage: :session attach [session_id]\n"
  }

  if (args.length === 1) {
    if (args[0] === "list" || args[0] === "ls") {
      return "Not implemented yet.\n";
    }
    return "Usage: :session attach [session_id]\n"
  }

  if (args.length === 2) {
    if (args[0] === "attach") {
      return attachSession(args[1]);
    } else {
      return "Usage: :session attach [session_id]\n"
    }
  }
}
