import { initializeMemory } from "../utils/sessionUtils.js";
import { addStoreToSessionStorage, countStoresInSessionStorage, isStoreActive } from "../utils/storageUtils.js";
import { getFunctions, getMcpFunctions } from "../function.js";
import { updateUserSetting } from "../utils/userUtils.js";
import { pingOllamaAPI, listOllamaModels } from "../utils/ollamaUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function use(args) {
  const usage = "Usage: :use [function|node|store|role]\n";

  // Use node
  if (args.length != 1) {
    return usage
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Name must be quoted with double quotes.";
  }

  const name = args[0].slice(1, -1);
  if (!name) {
    return "Invalid name.";
  }

  // Find model
  const modelInfo = await findModel(name);
  if (modelInfo) {
    if (!getSetting("user")) {
      return "Please login.";
    }

    // Set model
    setSetting("model", name);
    setSetting("baseUrl", modelInfo.base_url);

    return "Model is set to \`" + name + "\`. Use command \`:model\` to show current model information.";
  }

  // Find function
  let functions = getFunctions();
  functions = functions.concat(await getMcpFunctions());

  const function_ = functions.find((f) => f.name === name);
  if (function_) {
    // Add to localhostStorage and remote
    const currentFunctions = (getSetting("functions")).split(",");
    if (currentFunctions.includes(name)) {
      return "Function already in use.";
    } else {
      currentFunctions.push(name)
      setSetting("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (getSetting("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    }
    return "Function \`" + name + "\` is enabled for calling. You can use command \`:function [ls|list]\` to show all enabled functions.";
  }

  // Find node
  const nodeInfo = await findNode(name);
  if (nodeInfo) {
    if (!getSetting("user")) {
      return "Please login.";
    }

    // Set node
    setSetting("node", name);

    return "Node is set to \`" + name + "\`, you can directly talk to it, or use command \`:generate [input]\` to generate from it. Command \`:node\` shows current node information.";
  }
  
  // Find store
  const storeInfo = await findStore(name);
  if (storeInfo) {
    if (!getSetting("user")) {
      return "Please login.";
    }

    // Check if stores counter
    if (countStoresInSessionStorage() >= 3) {
      return "You can only use 3 stores at the same time. Please unuse one of them first.";
    }

    // Add to storage
    addStoreToSessionStorage(name);
    return "Store \`" + name + "\` is being used. You can directly talk to it, or use \`:search [text]\` to search data from it. You can use command \`:store\` to show current store information.";
  }

  // Find role
  if (await findRole(name)) {
    setSetting("role", name);

    // Reset session to forget previous memory
    initializeMemory();

    return "Role is set to \`" + name + "\`, you can use command \`:role\` to show current role and prompt. Memory is reset.";
  }

  return "Resource not found.";
}

async function findModel(name) {
  // Check local Ollama models
  if (await pingOllamaAPI()) {
    const ollamModels = await listOllamaModels();
    const ollamModelInfo = ollamModels.find((m) => m.name === name);
    if (ollamModelInfo) {
      // Set model to session storage
      setSetting("model", name);
      setSetting("baseUrl", ollamModelInfo.base_url);
      return ollamModelInfo;
    }
  }

  // Check if the model exists
  try {
    const response = await fetch("/api/model/" + name, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    // Model info
    const modelInfo = data.result;
    return modelInfo;
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function findNode(name) {
  // Check if the node exists
  try {
    const response = await fetch("/api/node/" + name, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    // Node info
    const nodeInfo = data.result;
    return nodeInfo;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function findStore(name) {
  // Check store active
  if (isStoreActive(name)) {
    // Already active
    return false;
  }

  // Check if the store exists
  try {
    const response = await fetch("/api/store/" + name, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    const storeInfo = data.result;
    return storeInfo;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function findRole(name) {
  // Check role exists
  try {
    const response = await fetch("/api/role/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (!data.result.system_roles.some((role) => role.role === name) 
    && (!data.result.user_roles || !Object.entries(data.result.user_roles).some(([key, value]) => value.role === name))) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}
