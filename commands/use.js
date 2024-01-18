import { initializeMemory } from "utils/sessionUtils";
import { addStoreToSessionStorage, countStoresInSessionStorage, isStoreActive } from "utils/storageUtils";

export default async function use(args) {
  const usage = "Usage: :use [node|store|role]\n";

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

  // 1. Find node
  if (await findNode(name)) {
    // Set node
    sessionStorage.setItem("node", name);
    return "Node is set to \`" + name + "\`, you can directly talk to it, or use command \`:generate [input]\` to generate from it. Command \`:node\` shows current node information.";
  }
  
  // 2. Find store
  if (await findStore(name)) {
    // Check if stores counter
    if (countStoresInSessionStorage() >= 3) {
      return "You can only use 3 stores at the same time. Please unuse one of them first.";
    }

    // Add to storage
    addStoreToSessionStorage(name);
    return "Store \`" + name + "\` is being used. You can directly talk to it, or use \`:search [text]\` to search data from it. You can use command \`:store\` to show current store information.";
  }

  // 3. Find role
  if (await findRole(name)) {
    sessionStorage.setItem("role", name);

    // Reset session to forget previous memory
    initializeMemory();

    return "Role is set to \`" + name + "\`, you can use command \`:role\` to show current role and prompt. Memory is reset.";
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
