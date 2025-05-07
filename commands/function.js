import { getFunctions, getMcpFunctions } from "../function.js";
import { updateUserSetting } from '../utils/userUtils.js';

export default async function function_(args) {
  const usage = "Usage: :function [ls|list]\n"
              + "       :function [name]\n"
              + "       :function use [name]\n"
              + "       :function unuse [name]\n";

  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = getFunctions();
    let mcpFunctionList = await getMcpFunctions();

    if (functions.length === 0) {
      return "No functions.";
    } else {
      const enabledFunctions = (localStorage.getItem("functions")).split(",");

      // Callable functions
      let callables = functions
        .concat(mcpFunctionList)
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

      if (callables.length === 0) {
        callables = "No callable functions.";
      }

      // System functions
      let systemFunctions = "\\" + functions.map((f) => {
        return f.name;
      }).join(" \\");

      // Add * to system functions
      for (const f of functions) {
        if (enabledFunctions.includes(f.name)) {
          systemFunctions = systemFunctions.replaceAll("\\" + f.name, "*\\" + f.name);
        }
      }

      if (systemFunctions.length === 0) {
        systemFunctions = "No system functions.";
      }

      // MCP functions
      let mcpFunctions = "";
      if (mcpFunctionList.length > 0) {
        mcpFunctions = "\\" + mcpFunctionList.map((f) => {
          return f.name;
        }).join(" \\");

        // Add * to system functions
        for (const mf of mcpFunctionList) {
          if (enabledFunctions.includes(mf.name)) {
            mcpFunctions = mcpFunctions.replaceAll("\\" + mf.name, "*\\" + mf.name);
          }
        }
      }

      return "Callable functions:\n" + callables + "\n\n"
           + "System functions:\n" + systemFunctions + "\n\n"
           + (mcpFunctionList.length > 0 ? "MCP functions:\n" + mcpFunctions : "");
    }
  }

  // Use function
  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :function use [name]\n"
    }

    let functionName = args[1];
    if (args[1].startsWith("\"") && args[1].endsWith("\"")) {
      functionName = args[1].slice(1, -1);
    }
    
    if (!functionName) {
      return "Invalid function name.";
    }

    // Check if the function exists
    let functions = getFunctions();
    functions = functions.concat(await getMcpFunctions());

    const function_ = functions.find((f) => f.name === functionName);
    if (!function_) {
      return "Function not found.";
    }

    // Add to localStorage and remote
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

    let functionName = args[1];
    if (args[1].startsWith("\"") && args[1].endsWith("\"")) {
      functionName = args[1].slice(1, -1);
    }

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

  // Function info
  // :function [name]
  if (args.length == 1) {
    let functionName = args[0];
    if (functionName.startsWith("\"") && functionName.endsWith("\"")) {
      functionName = functionName.slice(1, -1);
    }

    if (!functionName) {
      return "Invalid function name.";
    }

    // Check if the function exists
    let functions = getFunctions();
    functions = functions.concat(await getMcpFunctions());
    
    const function_ = functions.find((f) => f.name === functionName);
    if (!function_) {
      return "Function not found.";
    }

    return JSON.stringify(function_, null, 2);
  }

  return usage;
}
