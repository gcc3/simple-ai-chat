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
        let result = "";

        if (typeof data.result === "string") {
          result += data.result;
        } else if (data.result.text) {

          if (data.result.images) {
            for (let i = 0; i < data.result.images.length; i++) {
              result += "+img[" + data.result.images[i] + "]" + " ";
            }
          }

          result += data.result.text;
        } else {
          result += "Result fomat error.";
        }

        return result;
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
