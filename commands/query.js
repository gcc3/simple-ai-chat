export default async function query(args) {
  if (args.length != 1) {
    return "Usage: :query [input]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Word must be quoted with double quotes.";
  }

  const node = sessionStorage.getItem("node");
  if (!node) {
    return "No node selected.";
  }

  const input = args[0].slice(1, -1);
  try {
    const response = await fetch("/api/node/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        node,
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
