export default async function store(args) {
  const command = args[0];
  const usage = "Usage: :store [name?]\n" +
                "       :store [ls|list]\n" +
                "       :store use [name]\n" +
                "       :store reset\n" +
                "       :store add [name]\n" +
                "       :store [del|delete] [name]\n" +
                "       :store set owner [owner]\n" +
                "       :store set [key] [value]\n";

  // Get store info
  if (command === "") {
    const storeName = localStorage.getItem("store");
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
      alert(error.message);
    }
  }

  // Get store info by name
  if (args[0].startsWith("\"") && args[0].endsWith("\"")) {
    const storeName = args[0].slice(1, -1);
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
      alert(error.message);
    }
  }

  // List all available stores
  if (command === "ls" || command === "list") {
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

      return data.result.stores.join("\n");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
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
      && (!data.result.user_stores || !Object.entries(data.result.user_stores).some(([key, value]) => value.store === storeName))) {
        return "Store \"" + storeName + "\" does not exist.";
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }

    if (storeName != null) {
      sessionStorage.setItem("store", storeName);

      // Reset session to forget previous memory
      initializeSession();

      return "Store is set to \`" + storeName + "\`, you can use command \`:store\` to show current store information";
    } else {
      return "Invalid store name.";
    }
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
    const settings = JSON.stringify({});

    try {
      const response = await fetch("/api/store/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          settings,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        localStorage.setItem("store", name);
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
      return usage;
    }

    const name = args[1];
    if (!name) {
      return usage;
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

      localStorage.setItem("store", "");
      return "Store deleted.";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  // Setup a store
  if (command === "set") {
    if (args.length !== 4) {
      return usage;
    }

    const name = args[2];
    const setting = args[3];
    if (!name || !setting) {
      return usage;
    }

    try {
      const response = await fetch("/api/store/update/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          setting,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Store setup.";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  // Change store owner
  if (command === "set" && args[1] === "owner") {
    if (args.length !== 3) {
      return usage;
    }

    const owner = args[2];
    if (!owner) {
      return usage;
    }

    try {
      const response = await fetch("/api/store/update/owner", {
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

      return "Store owner changed.";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  return usage;
}
