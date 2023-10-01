export default async function queryNodeAi(query) {
  const node_ai_url = process.env.NODE_AI_URL;
  const response = await fetch("http://" + node_ai_url + "/query?" + new URLSearchParams({
      input: query,
    })
  , {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
  });

  const data = await response.json();
  return data.result;
}
