export default async function queryNodeAi(query, endpoint) {
  if (!query) return {
    success: false,
    error: "Invalid query.",
  }

  const response = await fetch(endpoint + "?" + new URLSearchParams({
      input: query,
    })
  , {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
  });

  const data = await response.json();
  
  // Veryfy format
  if (!data.result) {
    return {
      success: false,
      error: "Unexpected node response format.",
    };
  }

  if (typeof data.result !== "string" && !data.result.text) {
    return {
      success: false,
      error: "Unexpected node response format.",
    };
  }

  let message = "";
  if (typeof data.result === "string") {
    message = data.result;
  } else {
    message = data.result.text;
  }

  return {
    success: true,
    message: message,
    result: data,
  };
}
