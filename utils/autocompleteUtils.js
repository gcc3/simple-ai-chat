import { getFunctions } from "function";
import { getLangCodes } from "./langUtils";
import { getSettings } from "./settingsUtils";
import { getThemes } from "./themeUtils";

export async function getAutoCompleteOptions(prefix, nameToBeComleted) {
  if (prefix === ":role use " || prefix === ":role unuse ") {
    const response = await fetch("/api/role/list");
    const data = await response.json();
    if (response.status === 200 && data.success) {
      const role = [].concat(data.result.user_roles, data.result.system_roles).flat();
      return role.map((r) => r.role);
    } else {
      return [];
    }
  }

  if (prefix === ":store use " || prefix === ":store unuse ") {
    const response = await fetch("/api/store/list");
    const data = await response.json();
    if (response.status === 200 && data.success) {
      const store = [].concat(data.result.user_stores, data.result.group_stores, data.result.system_stores).flat()
      return store.map((s) => s.name);
    } else {
      return [];
    }
  }

  if (prefix === ":node use ") {
    const response = await fetch("/api/node/list");
    const data = await response.json();
    if (response.status === 200 && data.success) {
      const node = [].concat(data.result.user_nodes, data.result.group_nodes, data.result.system_nodes).flat()
      return node.map((s) => s.name);
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

  return [];
}