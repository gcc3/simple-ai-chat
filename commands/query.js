export default async function query(args) {
  if (args.length != 1) {
    return "Usage: :query [query]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Word must be quoted with double quotes.";
  }

  const store = sessionStorage.getItem("store");
  if (!store) {
    return "No store selected.";
  }

  const input = args[0].slice(1, -1);
  try {
    const response = await fetch("/api/store/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        store,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      if (data.result) {
        return JSON.stringify(data.result, null, 2);
      } else {
        return "No response.";
      }
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
