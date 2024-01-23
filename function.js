import getWeather from "./functions/get_weather.js";
import getTime from "./functions/get_time.js";
import redirectToUrl from "./functions/redirect_to_url.js";
import askWolframalpha from "functions/ask_wolframalpha.js";

// `tools` is a generated json from OpenAI API
export function toolsToFunctions(tools) {
  let functions = [];
  for (let i = 0; i < tools.length; i++) {
    if (tools[i].type === "function") {
      functions.push(tools[i].function.name + "(" + JSON.stringify(tools[i].function.parameters) + ")");
    }
  }
  return functions;
}

/*
`functions` is a list of function strings
e.g. ["get_time({\"timezone\": \"America/Los_Angeles\"})"]
`executeFunctions` returns a list of results
e.g. [
  {
    success: true,
    function: "get_time({\"timezone\": \"America/Los_Angeles\"})",
    message: "The current time is 3:30 PM.",
    event: {
      event_details...
    }
  },
  {
    success: false,
    function: "get_weather({\"location\": \"San Francisco, CA\"})",
    error: "The location is not found."
  }
]
*/
export function executeFunctions(functions) {
  return Promise.all(functions.map(async (f) => {
    const funcName = f.split("(")[0];
    const funcArgs = f.slice(funcName.length + 1, -1);
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

  if (functionName === "ask_wolframalpha") {
    return askWolframalpha(paramObject);
  }

  if (functionName === "redirect_to_url") {
    return redirectToUrl(paramObject);
  }
}

export function getFunctions() {
  let functions = []

  // Get time
  functions.push({
    name: 'get_time',
    friendly_name: 'Time',
    description: 'Provide the current time. If user ask question related to time, this function should be called.',
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
    friendly_name: 'Weather',
    description: 'Get current weather for a given location or city, e.g. San Francisco, CA.',
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

  // Ask Wolfram Alpha
  functions.push({
    name: 'ask_wolframalpha',
    friendly_name: 'WolframAlpha',
    description: 'Ask Wolfram Alpha a question. Wolfram Alpha is a computational knowledge engine mainly for resoving mathematical questions. It also can search for what you want to know about, such as "What is the population of San Francisco?" or "What is the capital of France?".',
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The question to ask.",
        }
      },
      required: ["query"],
    }
  });

  // Redirect to url
  functions.push({
    name: 'redirect_to_url',
    friendly_name: 'Redirection',
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
          description: "Whether to open the URL in a new tab. Open in new tab except user request to open in same tab.",
        }
      },
      required: ["url"],
    }
  });

  return functions;
}

// A tools wrapper for functions
export async function getTools() {
  let functions = getFunctions();

  let tools = []
  for (let i = 0; i < functions.length; i++) {
    tools.push({
      type: "function",
      function: functions[i]
    });
  }

  return tools;
}
