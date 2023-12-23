import { initializeSession } from "utils/sessionUtils";
import session from "./session";

export default async function store(args, files) {
  const command = args[0];
  const usage = "Usage: :store [name?]\n" +
                "       :store [ls|list]\n" +
                "       :store use [name]\n" +
                "       :store reset\n" +
                "       :store add [name]\n" +
                "       :store data upload [file]\n" +
                "       :store data reset [name?]\n" +
                "       :store [del|delete] [name]\n" +
                "       :store set owner [owner]\n" +
                "       :store set [key] [value]\n";

  // Get store info
  // :store [name?]
  if (!command) {
    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    const storeName = sessionStorage.getItem("store");
    if (!storeName) {
      return "No data store is set, please use command \`:store use [name]\` to set a store.";
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

  // Get store info by name
  // :store [name?]
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

      if (data.result.stores.length === 0 && (!data.result.user_stores || Object.entries(data.result.user_stores).length === 0)) {
        return "No available store found.";
      } else {
        // Found some stores
        let userStores = "";
        if (data.result.user_stores && Object.entries(data.result.user_stores).length > 0) {
          let stores = [];
          Object.entries(data.result.user_stores).forEach(([key, value]) => {
            stores.push(value.name);
          });
          userStores = "User stores: \n" 
                     + "\\" + stores.join(" \\") + "\n\n";
        } else {
          userStores = "User stores: \n" 
                     + "No user store found." + "\n\n";
        }

        // Found some stores
        let groupStores = "";
        if (data.result.stores && Object.entries(data.result.stores).length > 0) {
          let stores = [];
          Object.entries(data.result.stores).forEach(([key, value]) => {
            stores.push(value.name);
          });
          groupStores = "Stores: \n" 
                    + "\\" + stores.join(" \\") + "\n\n"; 
        } else {
          groupStores = "Stores: \n" 
                      + "No store found." + "\n\n";
        }

        // Add star to current store
        let result = userStores + groupStores;
        if (sessionStorage.getItem("store")) {
          const currentStore = sessionStorage.getItem("store");
          result = result.replace("\\" + currentStore, "*\\" + currentStore);
        }
        return result;
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    return "";
  }

  // Use store
  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :store use [name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Store name must be quoted with double quotes.";
    }

    const storeName = args[1].slice(1, -1);
    if (!storeName) {
      return "Invalid store name.";
    }

    // Check store exists
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

      if (!data.result.stores.includes(storeName) 
      && (!data.result.user_stores || !Object.entries(data.result.user_stores).some(([key, value]) => value.name === storeName))) {
        return "Store \"" + storeName + "\" does not exist.";
      }
    } catch (error) {
      console.error(error);
      return error;
    }

    sessionStorage.setItem("store", storeName);

    // Reset session to forget previous memory
    initializeSession();
    return "Store is set to \`" + storeName + "\`, you can use command \`:store\` to show current store information";
  }

  // Reset store
  if (command === "reset") {
    if (sessionStorage.getItem("store") === "") {
      return "Store is already empty.";
    }

    sessionStorage.setItem("store", "");  // reset store

    // Reset session to forget previous memory
    initializeSession();
    return "Store reset.";
  }

  // Add a store
  if (command === "add") {
    if (args.length !== 2) {
      return "Usage: :store add [name]\n";
    }

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Store name must be quoted with double quotes.";
    }

    const name = args[1].slice(1, -1);

    try {
      const response = await fetch("/api/store/add", {
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
        sessionStorage.setItem("store", name);
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
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
          name: sessionStorage.getItem("store"),
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

    let name = "";
    if (args.length === 2) {
      name = sessionStorage.getItem("store");
      if (!name) {
        return "No data store is set, please use command \`:store use [name]\` to set a store.";
      }
    } else {
      name = args[2].slice(1, -1);
      if (!name) {
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
          name,
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
        if (sessionStorage.getItem("store") === name) {
          sessionStorage.setItem("store", "");
        }
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

    const storeName = sessionStorage.getItem("store");
    if (!storeName) {
      return "No data store is set, please use command \`:store use [name]\` to set a store.";
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

    const storeName = sessionStorage.getItem("store");
    if (!storeName) {
      return "No data store is set, please use command \`:store use [name]\` to set a store.";
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
