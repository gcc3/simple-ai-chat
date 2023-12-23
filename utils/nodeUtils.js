export default async function queryNodeAi(query, endpoint) {
  if (!query) return {
    success: false,
    error: "Invalid query.",
  }

  const response = await fetch(endpoint + new URLSearchParams({
      input: query,
    })
  , {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
  });

  const data = await response.json();
  return {
    success: true,
    message: data.result
  };
}
