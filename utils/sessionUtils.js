export function initializeMemory() {
  console.log("Memory initializing...");
  const time = Date.now()
  setTime(time);
  setSession(time);
  console.log("Session is initialized.");
}

export function initializeSession() {
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

  if (session.length != 13 || session <= 1669766400000 || session >= 2016921600000) {
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
  sessionStorage.setItem("time", time);
  console.log("Time set to " + time + ".");
}

export function setSession(session) {
  sessionStorage.setItem("session", session);
  console.log("Session set to " + session + ".");
}