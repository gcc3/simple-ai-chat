import { getFunctions } from "function";

export default async function function_(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    let functions = getFunctions();

    if (functions.length === 0) {
      return "No entry found.";
    } else {
      return functions.map((f) => {
        const args =(() => Object.keys(f.parameters.properties).map((p) => {
          return `\"${p}\": \"___\"`;
        }).join(", "))();

        return `!${f.name}({ ${args} })`;
      }).join(" ");
    }
  }

  return "Usage: :function [ls|list]";
}
