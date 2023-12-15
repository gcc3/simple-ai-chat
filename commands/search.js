export default async function search(args) {
  if (args.length != 1) {
    return "Usage: :search [word]";
  }

  const store = sessionStorage.getItem("store");
  if (!store) {
    return "No store selected.";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Word must be quoted with double quotes.";
  }

  const word = args[0].slice(1, -1);
  try {
    const response = await fetch("/api/store/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        word,
        store,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      return JSON.stringify(data.result, null, 2);
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}