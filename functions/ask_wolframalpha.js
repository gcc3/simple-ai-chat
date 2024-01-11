import parseStringPromise from 'xml2js';

export default async function askWolframalpha(paramObject) {
  const query = paramObject.query;
  if (!query) return {
    success: false,
    error: "Invalid query.",
  }

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

  let result = "";
  const data = await parseStringPromise.parseStringPromise(responseText);  // XML to object
  if (!data.queryresult || !data.queryresult.pod || data.queryresult.pod.length === 0) {
    result = "Not found any knowledge from the WolframAlpha.";
  } else {
    let plaintext = "";
    data.queryresult.pod.map((pod) => {
      pod.subpod.map((subpod) => {
        plaintext += subpod["$"]["title"] + subpod.plaintext[0] + "\n\n";
      });
    });
    result = plaintext;
  }

  return {
    success: true,
    message: result,
  }
}
