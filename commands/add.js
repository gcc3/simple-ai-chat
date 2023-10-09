export default async function add(args) {
  if (args.length != 2) {
    return "Usage: :add [word] [definition]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"") 
  || !args[1].startsWith("\"") || !args[1].endsWith("\"")) {
    return "Word and definition must be quoted with double quotes.";
  }

  try {
    const response = await fetch("/api/entry/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word: args[0].replace(/[",]+/g, ""), definition: args[1].replace(/[",]+/g, "") }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    return "Added."
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  return "Usage: :add [word] [definition]";
}
