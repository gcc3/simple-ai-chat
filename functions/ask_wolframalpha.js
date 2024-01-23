import parseStringPromise from 'xml2js';

// Friendly name: WolframAlpha
export default async function askWolframalpha(paramObject) {
  const { query, keyword } = paramObject;

  if (!query) return {
    success: false,
    error: "Invalid query.",
  }

  let result = await queryWolframAlpha(query);
  if (!result.success) {
    // Try again with keyword
    return await queryWolframAlpha(keyword);
  }
  return result
}

async function queryWolframAlpha(query) {
  const response = await fetch("http://api.wolframalpha.com/v2/query?" + new URLSearchParams({
      appid: process.env.WOLFRAM_ALPHA_APPID,
      input: query,
      format: "plaintext",
      units: "metric"
    })
  , {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
  });

  const responseText = await response.text();
  const data = await parseStringPromise.parseStringPromise(responseText);  // XML to object

  if (!data.queryresult || !data.queryresult.pod || data.queryresult.pod.length === 0) {
    return {
      success: false,
      error: "Not found any knowledge from the WolframAlpha."
    }
  } else {
    let plaintext = "";
    data.queryresult.pod.map((pod) => {
      pod.subpod.map((subpod) => {
        plaintext += subpod["$"]["title"] + subpod.plaintext[0] + "\n\n";
      });
    });
    return {
      success: true,
      message: plaintext
    }
  }
}
