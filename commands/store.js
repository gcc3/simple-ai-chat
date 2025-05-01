import { addStoreToSessionStorage, countStoresInSessionStorage, getActiveStores, isStoreActive, removeStoreFromSessionStorage } from "utils/storageUtils";

export default async function store(args, files) {
  const command = args[0];
  const usage = "Usage: :store [name?]\n" +
                "       :store [ls|list]\n" +
                "       :store [use|unuse] [name]\n" +
                "       :store reset\n" +
                "       :store add [engine] [name]\n" +
                "       :store init [name?]\n" +
                "       :store data upload [file]\n" +
                "       :store data reset [name?]\n" +
                "       :store [del|delete] [name]\n" +
                "       :store set owner [owner]\n" +
                "       :store set [key] [value]\n";

  // Get store info
  // :store [name?], no name
  if (!command) {
    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    const stores = sessionStorage.getItem("stores");
    if (!stores) {
      return "No data store is set, please use command \`:store use [name]\` to set a store.";
    }

    const storeNames = stores.split(",").filter((store) => store !== "");
    let results = [];
    for (let i = 0; i < storeNames.length; i++) {
      try {
        const response = await fetch("/api/store/" + storeNames[i], {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        results.push(JSON.stringify(data.result, null, 2));
      } catch (error) {
        console.error(error);
        return error;
      }
    }
    return results.join(",\n");
  }

  // Get store info by name
  // :store [name?], has name
  if (args.length === 1 && args[0].startsWith("\"") && args[0].endsWith("\"")) {
    const storeName = args[0].slice(1, -1);
    if (!storeName) {
      return "Invalid store name.";
    }

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

      return JSON.stringify(data.result, null, 2);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // List available stores
  if (command === "ls" || command === "list") {
    if (args.length !== 1) {
      return "Usage: :store [ls|list]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    try {
      const response = await fetch("/api/store/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (Object.entries(data.result.user_stores).length === 0
       && Object.entries(data.result.group_stores).length === 0
       && Object.entries(data.result.system_stores).length === 0) {
        return "No available store found.";
      } else {
        // For adding star to current store
        const activeStores = getActiveStores();

        // User stores
        let userStores = "";
        if (data.result.user_stores && Object.entries(data.result.user_stores).length > 0) {
          let stores = [];
          Object.entries(data.result.user_stores).forEach(([key, value]) => {
            stores.push((activeStores.includes(value.name) ? "*\\" : "\\") + value.name);
          });
          userStores = "User stores: \n" 
                     + stores.join(" ") + "\n\n";
        }

        // Group stores
        let groupStores = "";
        if (data.result.group_stores && Object.entries(data.result.group_stores).length > 0) {
          let stores = [];
          Object.entries(data.result.group_stores).forEach(([key, value]) => {
            stores.push((activeStores.includes(value.name) ? "*\\" : "\\") + value.name);
          });
          groupStores = "Group Stores: \n" 
                      + stores.join(" ") + "\n\n"; 
        }

        // System stores
        let systemStores = "";
        if (data.result.system_stores && Object.entries(data.result.system_stores).length > 0) {
          let stores = [];
          Object.entries(data.result.system_stores).forEach(([key, value]) => {
            stores.push((activeStores.includes(value.name) ? "*\\" : "\\") + value.name);
          });
          systemStores = "System Stores: \n" 
                       + stores.join(" ") + "\n\n"; 
        }

        if (userStores === "" && groupStores === "" && systemStores === "") {
          return "No available store found.";
        }

        return userStores + groupStores + systemStores;
      }
    } catch (error) {
      console.error(error);
    }
    return "";
  }

  // Use store
  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :store [use|unuse] [name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Store name must be quoted with double quotes.";
    }

    const storeName = args[1].slice(1, -1);
    if (!storeName) {
      return "Invalid store name.";
    }

    // Check store active
    if (isStoreActive(storeName)) {
      return "Store \`" + storeName + "\` is already active.";
    }

    // Check if stores counter
    if (countStoresInSessionStorage() >= 3) {
      return "You can only use 3 stores at the same time. Please unuse one of them first.";
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
        return "Store not found.";
      }
    } catch (error) {
      console.error(error);
      return error;
    }

    // Add to storage
    addStoreToSessionStorage(storeName);
    return "Store \`" + storeName + "\` is being used. You can directly talk to it, or use \`:search [text]\` to search data from it. You can use command \`:store\` to show current store information.";
  }

  // Use store
  if (command === "unuse") {
    if (args.length != 2) {
      return "Usage: :store [use|unuse] [name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Store name must be quoted with double quotes.";
    }

    const storeName = args[1].slice(1, -1);
    if (!storeName) {
      return "Invalid store name.";
    }

    // Check store active
    if (!isStoreActive(storeName)) {
      return "Store \`" + storeName + "\` is not active";
    }

    // Remove from storage
    removeStoreFromSessionStorage(storeName);
    return "Store \`" + storeName + "\` unused.";
  }

  // Reset store
  if (command === "reset") {
    if (sessionStorage.getItem("stores") === "") {
      return "Store is already empty.";
    }

    sessionStorage.setItem("stores", "");  // reset store
    return "Store reset.";
  }

  // Add a store
  if (command === "add") {
    if (args.length !== 3) {
      return "Usage: :store add [engine] [name]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Engine must be quoted with double quotes.";
    }

    if (!args[2].startsWith("\"") || !args[2].endsWith("\"")) {
      return "Store name must be quoted with double quotes.";
    }

    const engine = args[1].slice(1, -1);
    if (!engine) {
      return "Invalid engine.";
    }

    const name = args[2].slice(1, -1);
    if (!name) {
      return "Invalid store name.";
    }

    const vaildEngines = ["mysql", "vectara"];
    if (!vaildEngines.includes(engine)) {
      return "Invalid engine. Valid engines are: " + vaildEngines.join(", ");
    }

    try {
      const response = await fetch("/api/store/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          engine,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        addStoreToSessionStorage(name);  // set active
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Initialize a store
  if (command === "init") {
    if (args.length !== 1 && args.length !== 2) {
      return "Usage: :store init [name?]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    let storeName = "";
    if (args.length === 2) {
      // User use a store name
      if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
        return "Store name must be quoted with double quotes.";
      }

      storeName = args[1].slice(1, -1);
      if (!storeName) {
        return "Invalid store name.";
      }
    } else {
      // Use current store
      storeName = sessionStorage.getItem("stores");
    }

    if (!storeName) {
      return "No data store is set, please use command \`:store use [name]\` to set a store.";
    }

    try {
      const response = await fetch("/api/store/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: storeName,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return "An error occurred during your request.";
    }
  }

  // Upload file for indexing
  if (command === "data" && args[1] === "upload") {
    if (args.length !== 2 || !files) {
      return "Usage: :store data upload [file]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }
    
    try {
      const response = await fetch("/api/store/file-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sessionStorage.getItem("stores"),
          files,  // array of file URLs
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Reset a store
  if (command === "data" && args[1] === "reset") {
    if (args.length !== 2 && args.length !== 3) {
      return "Usage: :store data reset [name?]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    if (!args[2].startsWith("\"") || !args[2].endsWith("\"")) {
      return "Store name must be quoted with double quotes.";
    }

    let storeName = "";
    if (args.length === 2) {
      storeName = sessionStorage.getItem("stores");
      if (!storeName) {
        return "No data store is set, please use command \`:store use [name]\` to set a store.";
      }

      if (storeName.indexOf(",") !== -1) {
        return "Multiple stores are being used. Please unuse all but one store.";
      }
    } else {
      storeName = args[2].slice(1, -1);
      if (!storeName) {
        return "Invalid store name.";
      }
    }

    try {
      const response = await fetch("/api/store/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: storeName,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Delete a store
  if (command === "del" || command === "delete") {
    if (args.length !== 2) {
      return "Usage: :store [del|delete] [name]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Store name must be quoted with double quotes.";
    }

    const name = args[1].slice(1, -1);
    if (!name) {
      return "Invalid store name.";
    }

    try {
      const response = await fetch("/api/store/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        removeStoreFromSessionStorage(name);  // inactive
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Change store owner
  if (command === "set" && args[1] === "owner") {
    if (args.length !== 3) {
      return "Usage: :store set owner [owner]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    const storeName = sessionStorage.getItem("stores");
    if (!storeName) {
      return "No data store is set, please use command \`:store use [name]\` to set a store.";
    }

    if (storeName.indexOf(",") !== -1) {
      return "Multiple stores are being used. Please unuse all but one store.";
    }

    const owner = args[2];
    if (!owner) {
      return "Invalid owner.";
    }

    try {
      const response = await fetch("/api/store/update/" + storeName + "/owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Set settings
  if (command === "set" && args[1]) {
    if (args.length != 3) {
      return "Usage: :user set [key] [value]";
    }
    
    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    const storeName = sessionStorage.getItem("stores");
    if (!storeName) {
      return "No data store is set, please use command \`:store use [name]\` to set a store.";
    }

    if (storeName.indexOf(",") !== -1) {
      return "Multiple stores are being used. Please unuse all but one store.";
    }

    // Check value must be quoted with double quotes.
    if (!args[2].startsWith("\"") || !args[2].endsWith("\"")) {
      return "Setting value must be quoted with double quotes.";
    }
    const key = args[1];
    const value = args[2].slice(1, -1);

    try {
      const response = await fetch("/api/store/update/" + storeName + "/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          value,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return data.message;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  return usage;
}
