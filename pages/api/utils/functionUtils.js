import { getWeather } from "../function/get_weather";

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

  if (functionName === "get_weather") {
    return getWeather(args.location);
  }
}

export function getFunctions() {
  return [
    {
      name: 'get_weather',
      description: 'Get weather for a given location or city.',
      parameters: {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
            }
        },
        required: ["location"],
      }
    }
  ];
}
