import { getSetting } from "../utils/settingsUtils.js";


export function initializeMemory() {
  console.log("Memory initializing...");
  const time = Date.now()
  setTime(time);
  setSession(time);
  console.log("Session is initialized.");
}

export function initializeSessionMemory() {
  console.log("Session initializing...");
  initializeMemory();
  sessionStorage.setItem("head", "");
  sessionStorage.setItem("historyIndex", -1);
}

// Session ID is a string of number.
export async function attachSession(sessionId) {
  try {
    const verifyResult = verifySessionId(sessionId);
    if (!verifyResult.success) {
      return verifyResult.message;
    }

    // Get session with API
    const response = await fetch("/api/session/" + sessionId);
    const result = await response.json();
    if (!result.success) {
      return result.error;
    }
    const session = result.result.session;

    setTime(session.created_at);
    setSession(session.id);

    return "Session (id:" + session.id + ") attached. Use `→` or `←` to navigate between session logs.";
  } catch (error) {
    console.error("Error attaching session:", error);
    return "Error attaching session. Please try again later.";
  }
}

function containsOnlyNumbers(str) {
  return /^\d+$/.test(str);
}

export function verifySessionId(session) {
  if (!session) {
    return {
      success: false,
      error: "Session is required." 
    };
  }

  if (!containsOnlyNumbers(session)) {
    return {
      success: false,
      error: "Session must be a number." 
    };
  }

  if (session <= 1669766400000 || session >= 2016921600000) {
    return {
      success: false,
      error: "Time traveler detected."
    };
  }

  return {
    success: true,
    message: "Session is valid."
  };
}

export function setTime(time) {
  if (time == 1 || time == -1) {
    const current = getSetting("time");
    time = Number(current) + time;
  }

  // Set time
  sessionStorage.setItem("time", time);
  console.log("Time -> " + time);
}

export function setSession(session) {
  if (session == 1 || session == -1) {
    const current = getSetting("session");
    session = Number(current) + session;
  }

  // Set session
  sessionStorage.setItem("session", session);
  console.log("Session -> " + session);
}

// Get session log
export const getSessionLog = async function(direction = "prev", session, time) {
  let log = null;
  const response = await fetch("/api/log/" + direction + "?session=" + session + "&time=" + time, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).catch(error => {
    console.error('Error:', error);
    return null;
  });
  log = await response.json()
  return log;
}

// Get history session
export const getHistorySession = async function(direction = "prev", currentSessionId) {
  if (!getSetting("user")) {
    console.log("User not logged in.");
    return null;
  }

  let session = null;
  console.log("Getting history session " + direction + " of " + currentSessionId + "...");
  const response = await fetch("/api/session/" + direction + "?sessionId=" + currentSessionId + "&user=" + getSetting("user"), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }).catch(error => {
    console.error('Error:', error);
    return null;
  });
  const data = await response.json()
  if (data.success) {
    session = data.result.session;
  }
  return session;
}