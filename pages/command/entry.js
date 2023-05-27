export default async function entry(args) {
  const command = args[1];

  if (command === "ls" || command === "list") {
    try {
      const response = await fetch("/api/entry_listing", {
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
    return "";
  }
  
  if (command === "rm" || command === "remove") {
    return "Usage: :entry [add|remove|list]";
  }
}
