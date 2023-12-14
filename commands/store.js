export default async function store(args) {
  const command = args[0];
  const usage = "Usage: :store [name?]\n" +
                "       :store [ls|list]\n" +
                "       :store use [name]\n" +
                "       :store add [name]\n" +
                "       :store [del|delete] [name]\n" +
                "       :store set [key] [value]\n" +
                "       :store set owner [owner]\n";

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
  if (args.length === 2) {
    const storeName = args[1];
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

  // Use a store
  if (command === "use") {
    if (args.length !== 2) {
      return usage;
    }

    const name = args[1];
    if (!name) {
      return usage;
    }

    localStorage.setItem("store", name);
  }

  // Add a store
  if (command === "add") {
    if (args.length !== 3) {
      return usage;
    }

    const name = args[1];
    const settings = args[2];
    if (!name || !settings) {
      return usage;
    }

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

      localStorage.setItem("store", name);
      return "Store added.";
    } catch (error) {
      console.error(error);
      alert(error.message);
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
