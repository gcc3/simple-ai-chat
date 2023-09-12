export default async function function_(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = [];
    functions.push("get_time(timezone=UTC)");
    functions.push("get_weather(location)");
    functions.push("query_ai(query)")

    if (functions.length === 0) {
      return "No entry found.";
    } else {
      return "\\" + functions.join(" \\");
    }
  }

  return "Usage: :function [ls|list]";
}
