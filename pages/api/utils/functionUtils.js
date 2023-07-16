import { getWeather } from "../functions/get_weather";

export function executeFunction(functionName, functionArgs) {
  if (functionName === "get_weather") {
    return getWeather(functionArgs.location);
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
