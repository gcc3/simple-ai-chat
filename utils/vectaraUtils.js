export async function vectaraQuery(query, corpusId, apiKey) {
  const response = await fetch("https://api.vectara.io/v1/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "customer-id": process.env.VECTARA_CUSTOMER_ID,
      "x-api-key": apiKey,
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
  if (data && data.responseSet && data.responseSet.length > 0) {
    const responseSet = data.responseSet[0];

    // Check if there is a result
    // only return if score is greater than 0.5
    if (responseSet.response.length > 0) {
      if (responseSet.response[0].score > 0.5) {
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
    } else {
      return null;
    }
  }
}

/*
{
    "access_token": "xxxxxxxxxxx",
    "expires_in": 3600,
    "token_type": "Bearer"
}
*/
export async function createVectaraJtwToken() {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.VECTARA_CLIENT_ID);
    params.append("client_secret", process.env.VECTARA_CLIENT_SECRET);

    const response = await fetch("https://vectara-prod-" + process.env.VECTARA_CUSTOMER_ID + ".auth.us-west-2.amazoncognito.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "customer-id": process.env.VECTARA_CUSTOMER_ID,
        "x-api-key": process.env.VECTARA_API_KEY,
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (data && data.access_token) {
      return data.access_token;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
  }
}

/*
  Response example:
  {
      "corpusId": 123,
      "status": {
          "code": "OK",
          "statusDetail": "Corpus Created",
          "cause": null
      }
  }
*/
export async function createVectaraCorpus(name, description, jwtToken) {
  try {
    const response = await fetch(`https://api.vectara.io/v1/create-corpus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + jwtToken,
        "Accept": "application/json",
        "customer-id": process.env.VECTARA_CUSTOMER_ID,
      },
      body: JSON.stringify({
        "corpus": {
          "id": 0,
          "name": name,
          "description": description,
          "dtProvision": "1",
          "enabled": true,
          "swapQenc": false,
          "swapIenc": false,
          "textless": false,
          "encrypted": true,
          "encoderId": "1",
          "metadataMaxBytes": 0,
          "customDimensions": [],
          "filterAttributes": []
        }
      }),
    });

    const data = await response.json();
    if (data && data.corpusId) {
      return data.corpusId;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

/*
  Response example:
  {
    "response": [
        {
            "keyId": "zwt_xxxxxxxxxxxxxxx",
            "status": {
                "code": "OK",
                "statusDetail": "",
                "cause": null
            }
        }
    ]
}
*/
export async function generateVectaraApiKey(corpusId, jwtToken) {
  const response = await fetch("https://api.vectara.io/v1/create-api-key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": process.env.VECTARA_CUSTOMER_ID,
    },
    body: JSON.stringify({
      "apiKeyData": [
        {
          "description": "test",
          "apiKeyType": "API_KEY_TYPE__SERVING_INDEXING",
          "corpusId": [
            corpusId
          ]
        }
      ]
    }),
  });

  const data = await response.json();
  if (data && data.response && data.response.length > 0) {
    return data.response[0].keyId;
  } else {
    return null;
  }
}

/*
  Response example:
  {
    "status": {
        "code": "OK",
        "statusDetail": "Corpus Deleted",
        "cause": null
    }
  }
*/
export async function deleteVectaraCorpus(corpusId, jwtToken) {
  const response = await fetch("https://api.vectara.io/v1/delete-corpus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": process.env.VECTARA_CUSTOMER_ID,
    },
    body: JSON.stringify({
      "corpusId": corpusId
    }),
  });

  const data = await response.json();
  if (data && data.status && (data.status.code === "OK" || data.status.code === "NOT_FOUND")) {
    return true;
  } else {
    return false;
  }
}

/*
  Response example:
  {
    "status": [
        {
            "code": "OK",
            "statusDetail": "",
            "cause": null
        }
    ]
  }
*/
export async function deleteVectaraApiKey(keyId, jwtToken) {
  const response = await fetch("https://api.vectara.io/v1/delete-api-key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": process.env.VECTARA_CUSTOMER_ID,
    },
    body: JSON.stringify({
      "keyId": [
        keyId
      ]
    }),
  });

  const data = await response.json();
  if (data && data.status && data.status.length > 0 && (data.status[0].code === "OK") || (data.status[0].code === "NOT_FOUND")) {
    return true;
  } else {
    return false;
  }
}

// Response similar with deleteVectaraCorpus
export async function resetVectaraCorpus(corpusId, jwtToken) {
  const response = await fetch("https://api.vectara.io/v1/reset-corpus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": process.env.VECTARA_CUSTOMER_ID,
    },
    body: JSON.stringify({
      "corpusId": corpusId
    }),
  });

  const data = await response.json();
  if (data && data.status && (data.status.code === "OK" || data.status.code === "NOT_FOUND")) {
    return true;
  } else {
    return false;
  }
}