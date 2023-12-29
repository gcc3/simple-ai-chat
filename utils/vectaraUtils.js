import FormData from 'form-data';
import fetch from 'node-fetch';

export async function vectaraQuery(query, corpusId, apiKey, scoreThreshold = 0.5, numberOfResults = 5, vectaraCustomerId) {
  if (!vectaraCustomerId) {
    return null;
  };

  const response = await fetch("https://api.vectara.io/v1/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "customer-id": vectaraCustomerId,
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: [
        {
          query: query,
          start: 0,
          numResults: numberOfResults,
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
              customerId: vectaraCustomerId,
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
    // only return if score is greater than score threshold
    if (responseSet.response.length > 0) {
      if (responseSet.response[0].score > scoreThreshold) {
        let result = [];
        const responseSet = data.responseSet[0];
        responseSet.response.forEach((r) => {
          if (r.score >= scoreThreshold) {
            const document = responseSet.document[r.documentIndex];
            const metadata = document.metadata;
            let title = "";
            metadata.forEach((m) => {
              if (m.name === "title") {
                title = m.value;
              }
            });
            title = title.replaceAll("\n", " ").replace(/\s+/g, ' ');  // trim title
            
            result.push({
              document: document.id,
              score: r.score,
              content: r.text,
              title: title,
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
export async function createVectaraJtwToken(clientId, clientSecret, customerId, apiKey) {
  if (!clientId || !clientSecret || !customerId || !apiKey) {
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    const response = await fetch("https://vectara-prod-" + customerId + ".auth.us-west-2.amazoncognito.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "customer-id": customerId,
        "x-api-key": apiKey,
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
export async function createVectaraCorpus(name, description, jwtToken, customerId) {
  if (!customerId) {
    return null;
  };

  try {
    const response = await fetch(`https://api.vectara.io/v1/create-corpus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + jwtToken,
        "Accept": "application/json",
        "customer-id": customerId,
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
export async function generateVectaraApiKey(corpusId, jwtToken, customerId) {
  if (!customerId) {
    return null;
  };

  const response = await fetch("https://api.vectara.io/v1/create-api-key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": customerId,
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
export async function deleteVectaraCorpus(corpusId, jwtToken, customerId) {
  if (!customerId) {
    return false;
  };

  const response = await fetch("https://api.vectara.io/v1/delete-corpus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": customerId,
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
export async function deleteVectaraApiKey(keyId, jwtToken, customerId) {
  if (!customerId) {
    return false;
  };

  const response = await fetch("https://api.vectara.io/v1/delete-api-key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": customerId,
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

/*
  Response example:
  {
    "status": {
      "code": "OK",
      "statusDetail": "string"
    }
  }
*/
export async function resetVectaraCorpus(corpusId, jwtToken, customerId) {
  if (!customerId) {
    return false;
  };

  const response = await fetch("https://api.vectara.io/v1/reset-corpus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + jwtToken,
      "Accept": "application/json",
      "customer-id": customerId,
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
    "response": {
      "status": {},
      "quotaConsumed": {
        "numChars": "string",
        "numMetadataChars": "string"
      }
    }
  }
*/
export async function uploadFileToVectaraCorpus(corpusId, files, jwtToken, customerId) {
  if (!customerId) {
    return false;
  };

  const fileUrl = files[0];

  // Download the file from the URL
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) throw new Error('Failed to download file.');
  const buffer = await fileResponse.buffer();

  // Prepare the file for upload
  const formData = new FormData();
  formData.append('file', buffer, { 
    filename: 'downloaded_file',
    contentType: fileResponse.headers.get('content-type'),
  });

  const response = await fetch("https://api.vectara.io/v1/upload?c=" + customerId + "&o=" + corpusId, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Authorization": "Bearer " + jwtToken,
      ...formData.getHeaders(),
    },
    body: formData
  });

  const data = await response.json();
  if (data && data.response && data.response.quotaConsumed && data.response.quotaConsumed.numChars > 0) {
    return true;
  } else {
    return false;
  }
}
