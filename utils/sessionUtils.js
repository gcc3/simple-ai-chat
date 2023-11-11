export function attachSession(sessionId) {
  if (sessionId != null && containsOnlyNumbers(sessionId) && sessionId.length === 13) {
    localStorage.setItem("queryId", sessionId);
    return "Attached.";
  } else {
    return "Invalid session ID.";
  }
}

function containsOnlyNumbers(str) {
  return /^\d+$/.test(str);
}
