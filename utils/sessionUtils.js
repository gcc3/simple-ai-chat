// import { getSessions } from "./sqliteUtils.js";

export async function listSessions() {
  let sessionlines = "";

  const sessions = await getSessions();
  sessionlines = sessions.map(l => {
    return "S=" + l.session;
  }).join('\n');

  return sessionlines;
}

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
