export default function session(args) {
  if (args.length === 0) {
    return "Usage: :session [session_id]\n"
  }

  const sessionId = args[0];
  if (sessionId != null && containsOnlyNumbers(sessionId) && sessionId.length === 13) {
    localStorage.setItem("queryId", sessionId);
    return "Attached";
  } else {
    return "Invalid session ID.";
  }
}

function containsOnlyNumbers(str) {
  return /^\d+$/.test(str);
}