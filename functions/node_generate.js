export default async function nodeGenerate(paramObject) {
  const { node, input } = paramObject;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const response = await fetch(baseUrl + "/api/node/generate", {
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

          if (data.result.image) {
            result += "+img[" + data.result.image + "]" + " ";
          }

          result += data.result.text;
        } else {
          result += "Result fomat error.";
        }
        
        return {
          success: true,
          message: result,
        }
      } else {
        return {
          success: false,
          message: "No result.",
        }
      }
    } else {
      return {
        success: false,
        message: data.error,
      }
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
