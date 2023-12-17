export default async function search(args) {
  if (args.length != 1) {
    return "Usage: :search [text]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Word must be quoted with double quotes.";
  }

  const store = sessionStorage.getItem("store");
  if (!store) {
    return "No store selected.";
  }

  const text = args[0].slice(1, -1);
  try {
    const response = await fetch("/api/store/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        store,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      if (data.result && data.result.length > 0) {
        let result = "";
        for (let i = 0; i < data.result.length; i++) {
          result += "Document: " + data.result[i].document + "\n" +
                    (data.result[i].title && "Title: " + data.result[i].title) + "\n" +
                    "Score: " + data.result[i].score + "\n" +
                    "Content:\n" + data.result[i].content + "\n\n";
        }
        return result;
      } else {
        return "No results found.";
      }
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
