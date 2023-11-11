import { getFunctions } from "function";

export function getTools() {
  let tools = []

  // get functions
  let functions = getFunctions();
  for (let i = 0; i < functions.length; i++) {
    tools.push({
      type: "function",
      function: functions[i]
    });
  }

  return tools;
}
