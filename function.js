import getWeather from "./functions/get_weather.js";
import getTime from "./functions/get_time.js";
import redirectToUrl from "./functions/redirect_to_url.js";

export function executeFunctions(functions) {
  return Promise.all(functions.map(async (f) => {
    const funcName = f.split("(")[0];
    const funcArgs = f.split("(")[1].split(")")[0];
    try {
      const result = await executeFunction(funcName, funcArgs);
      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        function: f,
        message: result.message,
        event: result.event,
      };
    } catch (error) {
      return {
        success: false,
        function: f,
        error: error.message,
      };
    }
  }));
}

export function executeFunction(functionName, argsString) {
  if (process.env.USE_FUNCTION_CALLING !== "true") {
    return {
      success: false,
      error: "function calling is not enabled.\n"
    }
  }
  
  // functionArgs is a json string
  let paramObject = null;
  try {
    paramObject = JSON.parse(argsString);
  } catch (error) {
    return {
      success: false,
      error: "Invalid arguments.",
    }
  }

  // Functions
  if (functionName === "get_time") {
    return getTime(paramObject);
  }
  
  if (functionName === "get_weather") {
    return getWeather(paramObject);
  }

  if (functionName === "redirect_to_url") {
    return redirectToUrl(paramObject);
  }
}

export function getFunctions(lastFunctionName = null) {
  let functions = []

  // Get time
  functions.push({
    name: 'get_time',
    description: 'Provide the current time.',
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "The timezone to get the time for. Use tz database timezone names. If unknown, the time will be in UTC.",
        }
      },
      required: ["timezone"],
    }
  });

  // Get weather
  functions.push({
    name: 'get_weather',
    description: 'Get weather for a given location or city, e.g. San Francisco, CA. Do not use it except user asks for it.',
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA. If the city is not in English, translate it to English first.",
        }
      },
      required: ["location"],
    }
  });

  // Redirect to url
  // This function has strange behavior, when give it to AI it will be called again and again.
  // To avoid this, don't give it to AI when it is called last time.
  if (lastFunctionName !== "redirect_to_url") {
    functions.push({
      name: 'redirect_to_url',
      description: 'Redirect to a URL.',
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to redirect to.",
          },
          blank: {
            type: "boolean",
            description: "Whether to open the URL in a new tab.",
          }
        },
        required: ["url"],
      }
    });
  }

  return functions;
}

// A tools wrapper for functions
export function getTools(lastFunctionName = null) {
  let functions = getFunctions(lastFunctionName);
  
  let tools = []
  for (let i = 0; i < functions.length; i++) {
    tools.push({
      type: "function",
      function: functions[i]
    });
  }

  return tools;
}
