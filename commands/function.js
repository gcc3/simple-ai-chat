import { getFunctions } from "../function.js";
import { updateUserSetting } from '../utils/userUtils.js';

export default async function function_(args) {
  const usage = "Usage: :function [ls|list]\n"
    + "       :function use [name]\n"
    + "       :function unuse [name]\n";

  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = await getFunctions();

    if (functions.length === 0) {
      return "No functions.";
    } else {
      const enabledFunctions = (localStorage.getItem("functions")).split(",");

      // Callable functions
      const callables = functions
        .filter((f) => enabledFunctions.includes(f.name))
        .map((f) => {
          const args = (() => Object.keys(f.parameters.properties).map((p) => {
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
        }).join("\n");

      // Available functions
      let availables = "\\" + functions.map((f) => {
        return f.name;
      }).join(" \\");

      // Add * to available functions
      for (const f of functions) {
        if (enabledFunctions.includes(f.name)) {
          availables = availables.replaceAll("\\" + f.name, "*\\" + f.name);
        }
      }

      return "Callable functions:\n" + callables + "\n\n"
           + "System functions:\n" + availables;
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

    // Check if the function exists
    const functions = await getFunctions();
    const function_ = functions.find((f) => f.name === functionName);
    if (!function_) {
      return "Function not found.";
    }

    // Add to localhostStorage and remote
    const currentFunctions = (localStorage.getItem("functions")).split(",");
    if (currentFunctions.includes(functionName)) {
      return "Function already in use.";
    } else {
      currentFunctions.push(functionName)
      localStorage.setItem("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (localStorage.getItem("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    }

    return "Function \`" + functionName + "\` is enabled for calling. You can use command \`:function [ls|list]\` to show all enabled functions.";
  }

  // Unuse function
  if (command === "unuse") {
    if (args.length != 2) {
      return "Usage: :function unuse [name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Function name must be quoted with double quotes.";
    }

    const functionName = args[1].slice(1, -1);
    if (!functionName) {
      return "Invalid function name.";
    }

    // Remove from localhostStorage and remote
    const currentFunctions = (localStorage.getItem("functions")).split(",");
    if (!currentFunctions.includes(functionName)) {
      return "Function not in use.";
    } else {
      const index = currentFunctions.indexOf(functionName);
      currentFunctions.splice(index, 1);
      localStorage.setItem("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (localStorage.getItem("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    }

    return "Function \`" + functionName + "\` is disabled for calling.";
  }

  return usage;
}
