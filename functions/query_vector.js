export default async function queryVector(query) {
  const response = await fetch("https://api.vectara.io/v1/query"
  , {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Accept': 'application/json', 
        "customer-id": process.env.VECTARA_CUSTOMER_ID,
        "x-api-key": process.env.VECTARA_API_KEY,
      },
      body: JSON.stringify({
        "query": [
          {
            "query": query,
            "start": 0,
            "numResults": 1,
            "contextConfig": {
              "charsBefore": 30,
              "charsAfter": 30,
              "sentencesBefore": 3,
              "sentencesAfter": 3,
              "startTag": "<b>",
              "endTag": "</b>"
            },
            "corpusKey": [
              {
                "customerId": process.env.VECTARA_CUSTOMER_ID,
                "corpusId": process.env.VECTARA_CORPUS_ID,
                "semantics": "DEFAULT",
              }
            ],
          }
        ]
      }),
  });

  const data = await response.json();
  let result = "";
  if (data.responseSet[0].response[0].score < 0.5) {
    result = "no similar context found.";
  } else {
    result = data.responseSet[0].response[0].text;
    result += " (result score: " + data.responseSet[0].response[0].score + ")";
  }
  return result;
}
