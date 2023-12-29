export async function queryNodeAi(input, settings) {
  if (!input) return {
    success: false,
    error: "Invalid query.",
  }

  if (!settings || !settings.endpoint || !settings.query_parameter_for_input) return {
    success: false,
    error: "Invalid settings.",
  }

  const endpoint = settings.endpoint;
  const queryParameterForInput = settings.query_parameter_for_input;

  const response = await fetch(endpoint + "?" + queryParameterForInput + "=" + input, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status !== 200 || !response.ok) {
    return {
      success: false,
      error: "An error occurred during your request.",
    };
  }

  try {
    const data = await response.json();

    // Veryfy format
    if (!data.result || (typeof data.result !== "string" && !data.result.text)) {
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

  if (settings.endpoint && settings.query_parameter_for_input) {
    isConfigured = true;
  }
  return isConfigured;
}