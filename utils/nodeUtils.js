import { getUser, getNode, getUserNodes } from './sqliteUtils.js';
import { getBaseURL } from './urlUtils.js';

const axios = require('axios');
const { Readable } = require('stream');

export async function findNode(nodeName, username) {
  let node = null;
  const user = await getUser(username);

  // 1. user node
  node = await getNode(nodeName, user.username);

  // 2. group node
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

  // 3. system node
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

export async function queryNode(nodeInput, nodeSettings, histories = null, files_text = null, useStream = false, streamOutput = null) {
  if (!nodeInput) return {
    success: false,
    error: "Invalid query.",
  }

  const endpoint = nodeSettings.endpoint;
  const isSimpleNode = nodeSettings.isSimpleNode;
  const model = nodeSettings.model;
  const useHistory = nodeSettings.useHistory;

  // 0. Simple node
  if (isSimpleNode) {
    // Fetch
    const queryParams = new URLSearchParams({
      user_input: nodeInput,
    }).toString();

    try {
      const response = await fetch(`${endpoint}?${queryParams}`, {
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
      if (!data.result) {
        return {
          success: false,
          error: "Invalid response format.",
        };
      }

      return {
        success: true,
        result: data.result
      };
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }

  // I. Input
  // Prepare messages
  let messages = [];

  // -2. Files messages
  if (files_text && files_text.length > 0) {
    files_text.map((f) => {
      messages.push({
        role: 'system',
        content: "File url: " + f.file + "\n" 
                + "File content: " + f.text
      });
    });
  }

  // -1. History messages
  if (useHistory && histories && histories.length > 0) {
    histories.map((h) => {
      messages.push({ role: 'user', content: h.input });
      messages.push({ role: 'assistant', content: h.output });
    });
  }

  // 0. User messages
  if (nodeInput) {
    messages.push({ role: 'user', content: nodeInput });
  }

  // II. Output
  // Result text
  let result = "";

  // III. Execute
  // Stream output
  if (useStream && streamOutput) {
    const response = await axios.post(endpoint, {
      model: model,
      messages: messages,
    }, { responseType: 'stream' });

    // Convert the response stream into a readable stream
    const stream = Readable.from(response.data);

    // Handle the data event to process each JSON line
    return new Promise((resolve, reject) => {
      // Send the ENV
      if (model && model !== "") {
        streamOutput(`###MODEL###${model}`);
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
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: false,
        }),
      });
    
      if (response.status !== 200 || !response.ok) {
        return {
          success: false,
          error: "An error occurred during your request.",
        };
      }

      const data = await response.json();

      // Verify format
      if (!data.message || !data.message.content) {
        return {
          success: false,
          error: "Invalid response format.",
        };
      }

      // Set result
      result = data.message.content;

      // Use streamer to show output
      if (streamOutput) {
        streamOutput(data.message.content, model);
      }
      
      return {
        success: true,
        result: result,
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
export function checkIsNodeConfigured(settings) {
  if (!settings) return false;
  if (!settings.endpoint || settings.endpoint === "___") return false;
  return true;
}

export function verifyNodeSettings(settings) {
  const messages = [];

  // Endpoint check
  if (!settings.endpoint || settings.endpoint === "___") {
    messages.push("Error: `endpoint` not set.");
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
    const response = await fetch(getBaseURL(endpoint), {
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
    "endpoint": "___",            // the full endpoint of the node, example: "http://localhost:5000/api/v1/"
    "apiKey": "___",              // If the API key is necessary
    "model": "___",               // One of the model of the node
    "useHistory": false,          // Use history or not
    "useFuncitonCalling": false,  // Use function calling or not, some model not support
    "description": "",            // The description of the node
    "isSimpleNode": false,        // A simple node only accept "user_input" (not messages) and use "result" as output
  };
}