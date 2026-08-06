import { attachSession } from "../utils/session.js";

export default async function attach(args) {
  const usage = "Usage: :attach [session_id]";
  
  if (args.length != 1) {
    return usage;
  }

  return attachSession(args[0]);
}
