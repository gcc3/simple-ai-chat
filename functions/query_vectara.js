export default async function queryVectara(query) {
  const response = await fetch("https://api.vectara.io/v1/query"
  , {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "customer-id": process.env.VECTARA_CUSTOMER_ID,
        "x-api-key": process.env.VECTARA_API_KEY,
      },
      body: JSON.stringify({
        "query": query,
        "corpusKey": [
          {
            "customerId": process.env.VECTARA_CUSTOMER_ID,
            "corpusId": process.env.VECTARA_CORPUS_ID,
            "semantics": "DEFAULT",
            "lexicalInterpolationConfig": {
              "lambda": 0
            }
          }
        ]
      }),
  });

  const data = await response.json();
  return data.result;
}
