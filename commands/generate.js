import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function generate(args) {
  if (args.length != 1) {
    return "Usage: :generate [input]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Word must be quoted with double quotes.";
  }

  const node = getSetting("node");
  if (!node) {
    return "No node selected.";
  }

  const input = args[0].slice(1, -1);
  try {
    // Simple non-stream generation
    const response = await fetch("/api/node/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        node,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      return data.result;
    } else {
      return data.error;
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
