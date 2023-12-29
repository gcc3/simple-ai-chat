export async function queryNodeAi(input, settings) {
  if (!input) return {
    success: false,
    error: "Invalid query.",
  }

  if (!settings || !settings.endpoint || !settings.queryParameterForInput) return {
    success: false,
    error: "Invalid settings.",
  }

  const endpoint = settings.endpoint;
  const queryParameterForInput = settings.queryParameterForInput;

  try {
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

export async function generateNodeFunction(node) {
  const settings = JSON.parse(node.settings);

  const description = settings.description || "";
  const inputDescription = settings.inputDescription || "";

  let function_ = null;
  function_ = {
    name: "node_generate",
    description: description,
    parameters: {
      type: "object",
      properties: {
        node: {
          type: "string",
          description: "A JSON string of data source access configuration. In this case use \"" + JSON.stringify(node) + "\"",
        },
        input: {
          type: "string",
          description: inputDescription
        },
      },
      required: ["node", "input"],
    }
  };
  return function_;
}

export function isNodeConfigured(settings) {
  let isConfigured = false;
  if (!settings) {
    return false;
  }

  if (settings.endpoint && settings.queryParameterForInput) {
    isConfigured = true;
  }
  return isConfigured;
}