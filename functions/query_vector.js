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
            "numResults": 5,
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
  let documents = [];

  if (data.responseSet === undefined || data.responseSet.length === 0) {
    result = "no response set found.";
  } else if (data.responseSet[0].response === undefined || data.responseSet[0].response.length === 0) {
    result = "no response found.";
  }

  if (data.responseSet[0].response[0].score < 0.5) {
    result = "no similar context found.";
  } else {
    const responseSet = data.responseSet[0];
    responseSet.response.forEach(r => {
      if (r.score >= 0.5) {
        const document = responseSet.document[r.documentIndex];
        result += "response - score = " + r.score 
                         + ", document = " + document.id 
                         + ", content = " + r.text + "\n";

        // add document, but only once
        if (!documents.includes(document.id)) {
          documents.push(document.id);
        }
      }
    });
    result += " ###VECTOR###" + documents.join(" ");
  }

  if (!result.endsWith("\n")) result += "\n";
  return result;
}
