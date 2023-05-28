export default async function search(args) {
  if (args.length != 1) {
    return "Usage: :search [keyword]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Keyword must be quoted with double quotes.";
  }
  
  const keyword = args[0];
  try {
    const response = await fetch("/api/entry/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.result.entries.length === 0) {
      return "No entry found.";
    } else {
      return data.result.entries.join(" ");
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
  return "";
}
