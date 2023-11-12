// Session ID is a string of number.
export function attachSession(sessionId) {
  const verifyResult = verifySessionId(sessionId);

  if (!verifyResult.success) {
    return verifyResult.message;
  }

  localStorage.setItem("queryId", sessionId);
  return "Attached.";
}

function containsOnlyNumbers(str) {
  return /^\d+$/.test(str);
}

export function verifySessionId(queryId) {
  if (!queryId) {
    return {
      success: false,
      message: "Session ID (`query_id`) is required." 
    };
  }

  if (!containsOnlyNumbers(queryId)) {
    return {
      success: false,
      message: "Session ID must be a number." 
    };
  }

  if (queryId.length != 13 || queryId <= 1701302400 || queryId >= 2016921600) {
    return {
      success: false,
      message: "Time traveler detected."
    };
  }

  return {
    success: true,
    message: "Session ID is valid."
  };
}
