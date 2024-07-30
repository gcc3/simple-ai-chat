import { initializeMemory } from "utils/sessionUtils";
import { addStoreToSessionStorage, countStoresInSessionStorage, isStoreActive } from "utils/storageUtils";
import { getFunctions } from "function";

export default async function unuse(args) {
  const usage = "Usage: :unuse [function|store]\n";

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
  const functions = getFunctions();
  const function_ = functions.find((f) => f.name === name || f.friendly_name === name);
  if (function_) {
    // Remove from localhostStorage and remote
    const currentFunctions = (localStorage.getItem("functions")).split(",");
    if (!currentFunctions.includes(name)) {
      return "Function not in use.";
    } else {
      const index = currentFunctions.indexOf(name);
      currentFunctions.splice(index, 1);
      localStorage.setItem("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (localStorage.getItem("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    }
    return "Function \`" + name + "\` is disabled for calling.";
  }

  // Find node
  if (await findNode(name)) {
    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    ssessionStorage.setItem("node", "");  // reset node

    // Reset session to forget previous memory
    initializeSession();
    return "Node reset.";
  }
  
  // Find store
  if (await findStore(name)) {
    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

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
    if (sessionStorage.getItem("role") === "") {
      return "Role is already empty.";
    }

    sessionStorage.setItem("role", "");  // reset role

    // Reset session to forget previous memory
    initializeMemory();
    return "Role reset with memory.";
  }

  return "Resource not found.";
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
    let node = data.result;

    if (!node) {
      return false;
    } else {
      return true;
    }
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

    if (!data.result) {
      return false;
    } else {
      return true;
    }
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
