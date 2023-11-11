import getWeather from "./functions/get_weather.js";
import getTime from "./functions/get_time.js";
import queryNodeAi from "./functions/query_node_ai.js";
import queryVector from "./functions/query_vector.js";

export function executeFunction(functionName, functionArgs) {
  if (process.env.USE_FUNCTION_CALLING !== "true") {
    return "function calling is not enabled.\n";
  }
  
  // here functionArgs is a string
  // format: param1=value1, param2="value2", ...
  // Convert the string to an object with keys and values
  const paramObject = functionArgs.split(/,\s*/).reduce((acc, param) => {
    let [key, value] = param.split('=');

    // Trim any whitespace
    key = key.trim();
    value = value.trim();

    // Remove quotes from strings and convert "true" and "false" to booleans
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (!isNaN(value)) {
      // If it's a number, convert it
      value = Number(value);
    }

    acc[key] = value;
    return acc;
  }, {});

  // Functions
  if (functionName === "get_time") {
    return getTime(paramObject);
  }
  
  if (functionName === "get_weather") {
    return getWeather(paramObject);
  }
  
  // call other AI node to get help
  if (functionName === "query_node_ai") {
    if (process.env.USE_NODE_AI !== "true") return "AI Node is not enabled.";
    return queryNodeAi(paramObject);
  }

  // call vector database to get support data
  if (functionName === "query_vector") {
    if (process.env.USE_VECTOR !== "true") return "Vector database is not enabled.";
    return queryVector(paramObject);
  }

  return "No such function.";
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

  // query AI node
  // only if AI node is enabled
  if (process.env.USE_NODE_AI === "true") {
    functions.push({
      name: 'query_node_ai',
      description: 'Get support or data or assistant from another AI if you totally do not know the answer.',
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

  // query Vertara vector data
  // only if Vectara is enabled
  if (process.env.USE_VECTOR === "true") {
    functions.push({
      name: 'query_vector',
      description: 'Get support data from vector database.',
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A question string. As you lack of some information or data, you need to query from vector database.",
          }
        },
        required: ["query"],
      }
    });
  }

  return functions;
}
