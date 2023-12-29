export default async function generate(args) {
  if (args.length != 1) {
    return "Usage: :generate [input]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Word must be quoted with double quotes.";
  }

  const node = sessionStorage.getItem("node");
  if (!node) {
    return "No node selected.";
  }

  const input = args[0].slice(1, -1);
  try {
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
      if (data.result) {
        if (typeof data.result === "string") {
          return data.result;
        } else if (data.result.text) {
          let result = "";

          if (data.result.image) {
            result += "+img[" + data.result.image + "]" + " ";
          }

          result += data.result.text;
          return result;
        } else {
          return "No result.";
        }
      } else {
        return "No result.";
      }
    } else {
      return data.error;
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
