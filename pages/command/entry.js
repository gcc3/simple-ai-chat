export default async function entry(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    try {
      const response = await fetch("/api/entry/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return data.result.entries.join(" ");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    return "";
  } 
  
  if (command === "add") {
    if (args.length < 3) {
      return "Usage: :entry add [word] [definition]";
    }

    try {
      const response = await fetch("/api/entry/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: args[1], defination: args[2] }),
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
    return "";
  }
  
  if (command === "rm" || command === "remove") {
    return "Usage: :entry [add|remove|list]";
  }

  return "Usage: :entry [add|remove|list]";
}
