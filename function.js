import getWeather from "./functions/get_weather.js";
import getTime from "./functions/get_time.js";
import redirectToUrl from "./functions/redirect_to_url.js";
import askWolframalpha from "./functions/ask_wolframalpha.js";
import { pingMcpServer, listMcpFunctions } from "utils/mcpUtils.js";

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

// Get functions
// `functions_` is a list of function callable, in browser storage
// If `functions_` is null, return all functions, this is used for listing functions
export async function getFunctions(functions_ = null) {
  let functions = []
  let callables = functions_ ? functions_.split(",") : [];

  // Get time
  if (!functions_ || callables.includes("get_time")) {
    functions.push({
      name: 'get_time',
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
  }

  // Get weather
  if (!functions_ || callables.includes("get_weather")) {
    functions.push({
      name: 'get_weather',
      description: 'Get current weather for a given location or city, e.g. San Francisco, CA. When using this function, the location must be provided, if not provided ask user to provide first.',
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA. Location cannot include an area name, must be a city name. The city name must be English.",
          }
        },
        required: ["location"],
      }
    });
  }

  // Ask Wolfram Alpha
  if (!functions_ || callables.includes("ask_wolframalpha")) {
    functions.push({
      name: 'ask_wolframalpha',
      description: 'This function send request to WolframAlpha, a computational knowledge engine mainly for resoving mathematical questions. It can answer questions in these fields: Mathematical Problems, Statistics and Data Analysis, Physics, Chemistry, Biology, History and Geography, Units and Measurements, Weather and Astronomy, Economics and Finance, Computational Sciences, Health and Medicine, Technology and Engineering, Music and Arts, Everyday Life. Other than these fileds cannot give answer. Here are 2 example questions, "What is the population of San Francisco?", "What is the capital of France?". The keyword is extracted from the question, it should be a terminology word.',
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The key word or question to ask. Generally a sentific question.",
          },
          keyword: {
            type: "string",
            description: "The keyword to ask. Generally a teminology word. Generate from the question.",
          },
        },
        required: ["query", "keyword"],
      }
    });
  }

  // Redirect to url
  if (!functions_ || callables.includes("redirect_to_url")) {
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
            description: "Whether to open the URL in a new tab. Open in new tab except user request to open in same tab.",
          }
        },
        required: ["url"],
      }
    });
  }

  // MCP functions
  if (await pingMcpServer()) {
    const mcpFunctions = await listMcpFunctions();
    for (const f of mcpFunctions) {
      if (!functions_ || callables.includes(f.name)) {
        functions.push({
          name: f.name,
          description: f.description,
          parameters: f.input_schema,  // TODO fix schema
        });
      }
    }
  }

  return functions;
}

// A tools wrapper for functions
// `functions_` is a list of function callable
export async function getTools(functions_) {
  let functions = getFunctions(functions_);

  let tools = []
  for (let i = 0; i < functions.length; i++) {
    tools.push({
      type: "function",
      function: functions[i]
    });
  }

  return tools;
}
