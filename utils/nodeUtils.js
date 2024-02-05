import { getUser, getNode, getUserNodes } from './sqliteUtils.js';

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

export function isMultimodalityNode(node) {
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

  return settings.multimodality;
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

export async function queryNodeAI(input, settings, history = null) {
  if (!input) return {
    success: false,
    error: "Invalid query.",
  }

  if (!settings || !settings.endpoint || !settings.queryParameterForInput) return {
    success: false,
    error: "Invalid settings.",
  }

  const endpoint = settings.endpoint;
  const queryParameterForInput = settings.queryParameterForInput;

  try {
    const response = await fetch(endpoint + "?" + queryParameterForInput + "=" + encodeURIComponent(input) 
                                          + "&history=" + encodeURIComponent(history), {
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

    // Veryfy format
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

export function isNodeConfigured(settings) {
  let isConfigured = false;
  if (!settings) {
    return false;
  }

  if (settings.endpoint && settings.queryParameterForInput) {
    isConfigured = true;
  }
  return isConfigured;
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