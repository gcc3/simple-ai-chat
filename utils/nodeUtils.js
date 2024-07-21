import { getUser, getNode, getUserNodes } from './sqliteUtils.js';

const axios = require('axios');
const { Readable } = require('stream');

export async function findNode(nodeName, username) {
  let node = null;
  const user = await getUser(username);

  // 1. user users
  node = await getNode(nodeName, user.username);

  // 2. group nodes
  if (!node) {
    const groups = user.group.split(',');
    for (const group of groups) {
      if (!group || group === user.username) {
        continue;
      }
      node = await getNode(nodeName, group);
      if (node) {
        break;
      }
    }
  }

  // 3. system nodes
  if (!node) {
    node = await getNode(nodeName, 'root');
  }

  return node;
}

export function getNodeSettings(node) {
  if (!node) {
    return null;
  }

  let settings = null;
  try {
    settings = JSON.parse(node.settings);
  } catch (error) {
    console.log(error);
  }

  return settings;
}

export function isNodeMultimodalityContains(node, value) {
  if (!node) {
    return false;
  }

  const settings = getNodeSettings(node);
  if (!settings) {
    return false;
  }

  if (!settings.multimodality) {
    return false;
  }

  return settings.multimodality.includes(value);
}

export function doNodeOverrideOutput(node) {
  if (!node) {
    return false;
  }

  const settings = getNodeSettings(node);
  if (!settings) {
    return false;
  }

  if (!settings.overrideOutputWithNodeResponse) {
    return false;
  }

  return settings.overrideOutputWithNodeResponse;
}

export async function queryNodeAI(input, settings, histories = null, files_text = null, streamOutput = null) {
  if (!input) return {
    success: false,
    error: "Invalid query.",
  }

  const endpoint = settings.endpoint;
  const method = settings.method;
  const multimodality = settings.multimodality;
  const overrideOutputWithNodeResponse = settings.overrideOutputWithNodeResponse;
  const queryParameterForInput = settings.queryParameterForInput;
  const queryParameterForHistories = settings.queryParameterForHistories;
  const queryParameterForFiles = settings.queryParameterForFiles;
  const useStream = settings.useStream;
  const model = settings.model;
  const description = settings.description;

  // Stream output
  if (useStream && streamOutput) {
    let messages = [];

    // Files messages
    if (files_text && files_text.length > 0) {
      files_text.map((f) => {
        messages.push({
          role: 'system',
          content: "File url: " + f.file + "\n" 
                 + "File content: " + f.text
        });
      });
    }

    // History messages
    if (histories && histories.length > 0) {
      histories.map((h) => {
        messages.push({ role: 'user', content: h.input });
        messages.push({ role: 'assistant', content: h.output });
      });
    }

    // User messages
    if (input) {
      messages.push({ role: 'user', content: input });
    }

    const response = await axios.post(endpoint, {
      model: model,
      messages: messages,
    }, { responseType: 'stream' });

    let result = "";

    // Convert the response stream into a readable stream
    const stream = Readable.from(response.data);

    // Handle the data event to process each JSON line
    return new Promise((resolve, reject) => {
      // Send the ENV
      if (model && model !== "") {
        streamOutput(`###ENV###${model}`);
      }

      // Handle the data event to process each JSON line
      stream.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
  
        lines.forEach((line) => {
          try {
            const json = JSON.parse(line);
            if (json.message && json.message.content) {
              if (result === "") {
                // Send clear signal
                streamOutput("[CLEAR]");
              }

              streamOutput(json.message.content);
              result += json.message.content;
            }
          } catch (error) {
            console.error('Error parsing JSON line:', error);
            stream.destroy(error); // Destroy the stream on error
          }
        });
      });
  
      // Resolve the Promise when the stream ends
      stream.on('end', () => {
        resolve({
          success: true,
          result: result,
        });
      });
  
      // Reject the Promise on error
      stream.on('error', (error) => {
        reject({
          success: false,
          error: error,
        });
      });
    });
  }

  // Non stream output
  if (!useStream || !streamOutput) {
    try {
      const response = await fetch(endpoint + "?" + queryParameterForInput + "=" + encodeURIComponent(input) 
                                            + "&" + queryParameterForHistories + "=" + encodeURIComponent(JSON.stringify(histories))
                                            + "&" + queryParameterForFiles + "=" + encodeURIComponent(JSON.stringify(files_text)), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    
      if (response.status !== 200 || !response.ok) {
        return {
          success: false,
          error: "An error occurred during your request.",
        };
      }

      const data = await response.json();

      // Verify format
      if (!data.result 
      || (typeof data.result !== "string" && !data.result.text && !data.result.images)
      || (data.result.images && !Array.isArray(data.result.images))) {
        return {
          success: false,
          error: "Unexpected node response format.",
        };
      }
      
      return {
        success: true,
        result: data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }
}

// Check necessary settings
export function isNodeConfigured(settings) {
  if (!settings) return false;
  if (!settings.endpoint || settings.endpoint === "___") return false;
  if (!settings.method || settings.method === "___") return false;
  return true;
}

export function verifyNodeSettings(settings) {
  const messages = [];

  // Endpoint check
  if (!settings.endpoint || settings.endpoint === "___") {
    messages.push("Error: `endpoint` not set.");
  }

  // Method check
  if (!settings.method || settings.method === "") {
    messages.push("Error: `method` not set.");
  } else if (settings.method !== "GET" && settings.method !== "POST") {
    messages.push("Error: `method` must be either `GET` or `POST`.");
  }

  return messages;
}

export async function pingNode(settings) {
  if (!settings.endpoint || settings.endpoint === "___") {
    return "Endpoint not set.";
  }
  const endpoint = settings.endpoint;

  // Fetch from endpoint
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200 || !response.ok) {
      return "Inconnectable.";
    }

    // Get response text
    const text = await response.text();

    if (text) {
      return text;
    } else {
      return "Connected.";
    }
  } catch (error) {
    return "Inconnectable.";
  }
}

export async function getAvailableNodesForUser(user) {
  // Get user nodes
  const userNodes = await getUserNodes(user.username);

  // Get group nodes
  const groups = user.group.split(',');
  const groupNodes = [];
  await groups.map(async g => {
    if (g === user.username) return;
    const groupNodes = await getUserNodes(g);
    groupNodes.push(groupNodes);
  });

  // Get system nodes
  let systemNodes = [];
  if (user.username != "root") {
    systemNodes = await getUserNodes('root');
  }

  return userNodes.concat(groupNodes).concat(systemNodes);
}

// Settings and initial values
export function getInitNodeSettings() {
  return {
    "endpoint": "___",                         // the full endpoint of the node, example: "http://localhost:5000/api/chat"
    "method": "GET",                           // the method of endpont, if use GET, the input is in query parameters, if use POST, the input is in body
    "queryParameterForInput": "input",
    "queryParameterForHistories": "histories",
    "queryParameterForFiles": "files",
    "multimodality": "",                       // multimodality of input, like image, audio, video input, example: "image,audio"
    "overrideOutputWithNodeResponse": false,   // If set to true, the output will only use node response.
    "useStream": false,                        // Streamed output
    "model": "",                               // Optional, if the endpoint support multipe models
    "description": "",
  };
}