import { getFunctions } from "function";

export default async function function_(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = getFunctions();

    if (functions.length === 0) {
      return "No entry found.";
    } else {
      return functions.map((f) => {
        // If properties type is string, add double quotes
        const args =(() => Object.keys(f.parameters.properties).map((p) => {
          if (f.parameters.properties[p].type === "string") {
            return `${p}="..."`;
          } else {
            return `${p}=...`;
          }
        }).join(", "))();

        return `!${f.name}(${args})`;
      }).join(" ");
    }
  }

  return "Usage: :function [ls|list]";
}
