import { getActiveStores } from "utils/storageUtils";

export default async function search(args) {
  if (args.length != 1) {
    return "Usage: :search [text]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Search text must be quoted with double quotes.";
  }
  const search = args[0].slice(1, -1);

  const activeStores = getActiveStores();
  if (activeStores.length === 0) {
    return "No store selected.";
  }

  // TODO, use Promise.all() to make this faster
  let results = [];
  for (const store of activeStores) {
    try {
      const response = await fetch("/api/store/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search,
          store,
        }),
      });
  
      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
  
      if (data.success) {
        const message = "Store: " + store + "\n"
                       + data.message;
        results.push(message.trim());
      } else {
        return data.error;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  return results.join("\n\n");
}
