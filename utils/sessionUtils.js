export function initializeSession() {
  console.log("Session initializing...");
  const time = Date.now()
  sessionStorage.setItem("time", time);
  sessionStorage.setItem("session", time);
}

// Session ID is a string of number.
export function attachSession(sessionId) {
  const verifyResult = verifySessionId(sessionId);

  if (!verifyResult.success) {
    return verifyResult.message;
  }

  sessionStorage.setItem("time", sessionId);
  sessionStorage.setItem("session", sessionId);
  return "Attached. To navigate between session histories: use `J` or `→` to navigate to the next, and use `K` or ←` to navigate to the previous.";
}

function containsOnlyNumbers(str) {
  return /^\d+$/.test(str);
}

export function verifySessionId(session) {
  if (!session) {
    return {
      success: false,
      message: "Session is required." 
    };
  }

  if (!containsOnlyNumbers(session)) {
    return {
      success: false,
      message: "Session must be a number." 
    };
  }

  if (session.length != 13 || session <= 1669766400000 || session >= 2016921600000) {
    return {
      success: false,
      message: "Time traveler detected."
    };
  }

  return {
    success: true,
    message: "Session is valid."
  };
}
