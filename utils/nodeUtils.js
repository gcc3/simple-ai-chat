export async function queryNodeAi(query, endpoint) {
  if (!query) return {
    success: false,
    error: "Invalid query.",
  }

  const response = await fetch(endpoint + "?" + new URLSearchParams({ input: query }), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status !== 200) {
    return {
      success: false,
      error: `Request failed with status ${response.status}`,
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: "An error occurred during your request.",
    };
  }

  try {
    const data = await response.json();
    if (!data.result) {
      return {
        success: false,
        error: "Unexpected node response format.",
      };
    }

    // Veryfy format
    if (!data.result) {
      return {
        success: false,
        error: "Unexpected node response format.",
      };
    }

    if (typeof data.result !== "string" && !data.result.text) {
      return {
        success: false,
        error: "Unexpected node response format.",
      };
    }
    
    return {
      success: true,
      result: data.result,
    };
  } catch (error) {
    return {
      success: false,
      error: error,
    };
  }
}

export function isNodeConfigured(settings) {
  let isConfigured = false;
  if (!settings) {
    return false;
  }

  if (settings.endpoint) {
    isConfigured = true;
  }
  return isConfigured;
}