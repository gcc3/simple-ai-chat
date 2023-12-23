import getWeather from "./functions/get_weather.js";
import getTime from "./functions/get_time.js";
import redirectToUrl from "./functions/redirect_to_url.js";

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

export function getFunctions() {
  let functions = []

  // get time
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

  // get weather
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

  // redirect to url
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

  return functions;
}
