export default async function function_(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = [];
    functions.push("get_time()");
    functions.push("get_weather(location)");

    if (functions.length === 0) {
      return "No entry found.";
    } else {
      return "\\" + functions.join(" \\");
    }
  }

  return "Usage: :function [ls|list]";
}
