import getWeather from "./functions/get_weather.js";
import getTime from "./functions/get_time.js";
import queryAi from "./functions/query_ai.js";

export function executeFunction(functionName, functionArgs) {
  // here functionArgs is a string
  // format: param1=value1, param2=value2, ...

  // convert to array of objects
  let args = {};
  functionArgs.split(",").map((functionArg) => {
    functionArg = functionArg.trim();
    const [key, value] = functionArg.split("=");
    args[key] = value;
  });

  // Functions
  if (functionName === "get_time") return getTime(args.timezone);
  if (functionName === "get_weather") return getWeather(args.location);
  if (functionName === "query_ai") return queryAi(args.query);  // call core AI to get help
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
            description: "The timezone to get the time for. If not provided, the time will be in UTC.",
          }
      },
      required: ["timezone"],
    },
  });

  // get weather
  functions.push({
    name: 'get_weather',
    description: 'Get weather for a given location or city.',
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

  // query AI
  // only if core AI is enabled
  if (process.env.USE_CORE_AI === "true") {
    functions.push({
      name: 'query_ai',
      description: 'Get support or data or assistant from another AI.',
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A question string. As you lack of some information or data, you need to ask another AI about that.",
          }
        },
        required: ["query"],
      }
    });
  }

  return functions;
}
