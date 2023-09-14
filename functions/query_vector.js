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
              "charsBefore": 60,
              "charsAfter": 60,
              "sentencesBefore": 5,
              "sentencesAfter": 5,
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

  if (data.responseSet === undefined || data.responseSet.length === 0) {
    result = "no response set found.";
  } else if (data.responseSet[0].response === undefined || data.responseSet[0].response.length === 0) {
    result = "no response found.";
  }

  if (data.responseSet[0].response[0].score < 0.5) {
    result = "no similar context found.";
  } else {
    const responseSet = data.responseSet[0];
    const response = responseSet.response[0];
    const document = responseSet.document[response.documentIndex];
    
    result = response.text;
    result += " ###VECTOR###" + response.score + "," + document.id;
  }

  if (!result.endsWith("\n")) result += "\n";
  return result;
}
