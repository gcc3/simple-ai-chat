export function getTools() {
  let tools = []

  // get time
  tools.push({
    type: "function",
    function: {
      description: 'Provide the current time.',
      name: 'get_time',
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
    }
  });

  // get weather
  tools.push({
    type: "function",
    function: {
      description: 'Get weather for a given location or city, e.g. San Francisco, CA. Do not use it except user asks for it.',
      name: 'get_weather',
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
  });

  // query AI node
  // only if AI node is enabled
  if (process.env.USE_NODE_AI === "true") {
    tools.push({
      type: "function",
      function: {
        description: 'Get support or data or assistant from another AI if you totally do not know the answer.',
        name: 'query_node_ai',
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
      }
    });
  }

  // query Vertara vector data
  // only if Vectara is enabled
  if (process.env.USE_VECTOR === "true") {
    tools.push({
      type: "function",
      function: {
        description: 'Get support data from vector database.',
        name: 'query_vector',
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
      }
    });
  }

  return tools;
}
