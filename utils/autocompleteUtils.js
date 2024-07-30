import { getFunctions } from "function";
import { getLangCodes } from "./langUtils";
import { getSettings } from "./settingsUtils";
import { getThemes } from "./themeUtils";
import { getVoices } from "./voiceUtils";

export async function getAutoCompleteOptions(prefix, nameToBeComleted) {
  if (prefix === ":role " || prefix === ":role use " || prefix === ":role unuse ") {
    const response = await fetch("/api/role/list");
    const data = await response.json();
    if (response.status === 200 && data.success) {
      const role = [].concat(data.result.user_roles, data.result.system_roles).flat();
      return role.map((r) => r.role);
    } else {
      return [];
    }
  }

  if (prefix === ":store " || prefix === ":store use " || prefix === ":store unuse " || prefix === ":store init " || prefix === ":store data reset " || prefix === ":store delete " || prefix === ":store del ") {
    const response = await fetch("/api/store/list");
    const data = await response.json();
    if (response.status === 200 && data.success) {
      const store = [].concat(data.result.user_stores, data.result.group_stores, data.result.system_stores).flat()
      return store.map((s) => s.name);
    } else {
      return [];
    }
  }

  if (prefix === ":store set ") {
    const name = sessionStorage.getItem("store");
    const response = await getStore(name);
    if (response.success) {
      const store = response.result;
      return Object.keys(store.settings);
    } else {
      return [];
    }
  }

  if (prefix === ":node " || prefix === ":node use " || prefix === ":node unuse " || prefix === ":node delete " || prefix === ":node del ") {
    const response = await fetch("/api/node/list");
    const data = await response.json();
    if (response.status === 200 && data.success) {
      const node = [].concat(data.result.user_nodes, data.result.group_nodes, data.result.system_nodes).flat()
      return node.map((s) => s.name);
    } else {
      return [];
    }
  }

  if (prefix === ":node set ") {
    const name = sessionStorage.getItem("node");
    const response = await getNode(name);
    if (response.success) {
      const nodeInfo = response.result;
      return Object.keys(nodeInfo.settings);
    } else {
      return [];
    }
  }

  if (prefix === ":theme ") {
    return getThemes();
  }

  if (prefix === ":lang use ") {
    return getLangCodes();
  }

  if (prefix === ":user set ") {
    return getSettings("keys_string_array_user")
  }

  if (prefix === ":set ") {
    return getSettings("keys_string_array_local");
  }

  if (prefix === ":function use " || prefix === ":function unuse ") {
    const functions = getFunctions();
    return functions.map((f) => f.friendly_name);
  }

  if (prefix === ":use " || prefix === ":unuse ") {
    let founds = [];
    
    // 1. functions
    founds = getFunctions().filter((f) => f.friendly_name.startsWith(nameToBeComleted));
    if (founds.length > 0) {
      return founds.map((f) => f.friendly_name);
    }

    // 2. nodes
    const responseNode = await fetch("/api/node/list");
    const dataNode = await responseNode.json();
    if (responseNode.status === 200 && dataNode.success) {
      const node = [].concat(dataNode.result.user_nodes, dataNode.result.group_nodes, dataNode.result.system_nodes).flat()
                     .find((n) => n.name.startsWith(nameToBeComleted));
      if (node) {
        return [node.name];
      }
    }

    // 3. stores
    const responseStore = await fetch("/api/store/list");
    const dataStore = await responseStore.json();
    if (responseStore.status === 200 && dataStore.success) {
      const store = [].concat(dataStore.result.user_stores, dataStore.result.group_stores, dataStore.result.system_stores).flat()
                       .find((s) => s.name.startsWith(nameToBeComleted));
      if (store) {
        return [store.name];
      }
    }

    // 4. roles
    const responseRole = await fetch("/api/role/list");
    const dataRole = await responseRole.json();
    if (responseRole.status === 200 && dataRole.success) {
      const role = [].concat(dataRole.result.user_roles, dataRole.result.system_roles).flat()
                      .find((r) => r.role.startsWith(nameToBeComleted));
      if (role) {
        return [role.role];
      }
    }
  }

  if (prefix === ":voice use ") {
    const voices = await getVoices();
    let langVoiceList = [];
    const currentLang = localStorage.getItem("lang").replace(" force", "");
    for (let i = 0; i < voices.length ; i++) {
      if (voices[i].lang === currentLang) {
        console.log(`Voice ${i+1}: ${voices[i].name}, ${voices[i].lang}`);
        langVoiceList.push(voices[i].name);
      }
    }
    return langVoiceList;
  }

  return [];
}

async function getNode(nodeName) {
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
    let nodeInfo = data.result;
    if (!nodeInfo) {
      return {
        success: false,
        error: "Node not exists."
      };
    } else {
      return {
        success: true,
        result: data.result
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "An error occurred during your request."
    };
  }
}

async function getStore(name) {
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

    if (!data.result) {
      return {
        success: false,
        error: "Store not exists."
      };
    } else {
      return {
        success: true,
        result: data.result
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "An error occurred during your request."
    };
  }
}