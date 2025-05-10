import { initializeMemory } from "../utils/sessionUtils.js";
import { isStoreActive, removeStoreFromSessionStorage } from "../utils/storageUtils.js";
import { getFunctions, getMcpFunctions } from "../function.js";
import { updateUserSetting } from '../utils/userUtils.js';
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function unuse(args) {
  const usage = "Usage: :unuse [name]\n";

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

  // Find function
  let functions = getFunctions();
  functions = functions.concat(await getMcpFunctions());
  
  const function_ = functions.find((f) => f.name === name);
  if (function_) {
    // Remove from localStorage and remote
    const currentFunctions = (getSetting("functions")).split(",");
    if (!currentFunctions.includes(name)) {
      return "Function not in use.";
    } else {
      const index = currentFunctions.indexOf(name);
      currentFunctions.splice(index, 1);
      setSetting("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (getSetting("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    }
    return "Function \`" + name + "\` is disabled for calling.";
  }

  // Find model
  const modelInfo = await findModel(name);
  if (modelInfo) {
    // Set model
    setSetting("model", globalThis.model);  // reset model
    setSetting("baseUrl", globalThis.baseUrl);  // reset base url

    return "Model unused, and reset to default model.";
  }

  // Find node
  const nodeInfo = await findNode(name);
  if (nodeInfo) {
    // clear node
    setSetting("node", "");

    // Reset session to forget previous memory
    initializeMemory();
    return "Node reset.";
  }
  
  // Find store
  const storeInfo = await findStore(name);
  if (storeInfo) {
    /// Check store active
    if (!isStoreActive(name)) {
      return "Store \`" + name + "\` is not active";
    }

    // Remove from storage
    removeStoreFromSessionStorage(name);
    return "Store \`" + name + "\` unused.";
  }

  // Find role
  if (await findRole(name)) {
    if (getSetting("role") === "") {
      return "Role is already empty.";
    }

    setSetting("role", "");  // reset role

    // Reset session to forget previous memory
    initializeMemory();
    return "Role reset with memory.";
  }

  return "Resource not found.";
}

async function findModel(modelName) {
  // Check if the model exists
  try {
    const response = await fetch("/api/model/" + modelName, {
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

async function findNode(nodeName) {
  // Check if the node exists
  try {
    const response = await fetch("/api/node/" + nodeName, {
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

async function findStore(storeName) {
  // Check store active
  if (isStoreActive(storeName)) {
    // Already active
    return false;
  }

  // Check if the store exists
  try {
    const response = await fetch("/api/store/" + storeName, {
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

async function findRole(roleName) {
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

    if (!data.result.system_roles.some((role) => role.role === roleName) 
    && (!data.result.user_roles || !Object.entries(data.result.user_roles).some(([key, value]) => value.role === roleName))) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}
