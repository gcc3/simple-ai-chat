import { getFunctions } from "function";

export default async function function_(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = getFunctions();

    if (functions.length === 0) {
      return "No functions.";
    } else {
      return functions.map((f) => {
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
    }
  }

  return "Usage: :function [ls|list]";
}
