import getWeather from "./functions/get_weather.js";
import getTime from "./functions/get_time.js";
import queryNodeAi from "./functions/query_node_ai.js";
import queryVector from "./functions/query_vector.js";
import redirectToUrl from "./functions/redirect_to_url.js";

export function executeFunction(functionName, argsString) {
  if (process.env.USE_FUNCTION_CALLING !== "true") {
    return "function calling is not enabled.\n";
  }
  
  // functionArgs is a json string
  const paramObject = JSON.parse(argsString);

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
        }
      },
      required: ["url"],
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
