export async function vectaraQuery(query, corpusId) {
  const response = await fetch("https://api.vectara.io/v1/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "customer-id": process.env.VECTARA_CUSTOMER_ID,
      "x-api-key": process.env.VECTARA_API_KEY,
    },
    body: JSON.stringify({
      query: [
        {
          query: query,
          start: 0,
          numResults: 5,
          contextConfig: {
            charsBefore: 60,
            charsAfter: 60,
            sentencesBefore: 5,
            sentencesAfter: 5,
            startTag: "<b>",
            endTag: "</b>",
          },
          corpusKey: [
            {
              customerId: process.env.VECTARA_CUSTOMER_ID,
              corpusId: corpusId,
              semantics: "DEFAULT",
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  if (data && data.responseSet && data.responseSet.length > 0 && data.responseSet[0].response[0].score > 0.5) {
    let result = [];
    const responseSet = data.responseSet[0];
    responseSet.response.forEach((r) => {
      if (r.score >= 0.5) {
        const document = responseSet.document[r.documentIndex];
        result.push({
          document: document.id,
          score: r.score,
          content: r.text,
        });
      }
    });
    return result;
  } else {
    return null;
  }
}