import { getWeather } from "../function/get_weather";
import { getTime } from "../function/get_time";

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
  if (functionName === "get_time") return getTime();
  if (functionName === "get_weather") return getWeather(args.location);
}

export function getFunctions() {
  return [
    {
      name: 'get_time',
      description: 'Get current time.',
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
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
    }
  ];
}
