import { getFunctions } from "function";

export default async function function_(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = getFunctions();

    if (functions.length === 0) {
      return "No functions.";
    } else {
      const callables = functions.map((f) => {
        const isEnabled = (localStorage.getItem("functions")).split(",").includes(f.name);
        if (!isEnabled) return "";

        const args =(() => Object.keys(f.parameters.properties).map((p) => {
          const type = f.parameters.properties[p].type;
          if (type === "string") {
            return `\"${p}\": \"___\"`;
          } else if (type === "boolean") {
            return `\"${p}\": [true|false]`;
          } else {
            return `\"${p}\": [${type}]`;
          }
        }).join(", "))();

        return `!${f.name}({ ${args} })`;
      }).join(" ");

      return "Callable functions:\n" + callables;
    }
  }

    // Use function
  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :function use [name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Function name must be quoted with double quotes.";
    }

    const functionName = args[1].slice(1, -1);
    if (!functionName) {
      return "Invalid function name.";
    }

    // Check if the node exists
    const functions = getFunctions();
    const function_ = functions.find((f) => f.name === functionName || f.friendly_name === functionName);
    if (!function_) {
      return "Function not found.";
    }

    // Add to localhostStorage
    const currentFunctions = (localStorage.getItem("functions")).split(",");
    if (currentFunctions.includes(functionName)) {
      return "Function already in use.";
    } else {
      currentFunctions.push(functionName)
      localStorage.setItem("functions", currentFunctions.join(","));
    }

    return "Function \`" + functionName + "\` is enabled for calling. You can use command \`:function [ls|list]\` to show all enabled functions.";
  }

  return "Usage: :function [ls|list]";
}
