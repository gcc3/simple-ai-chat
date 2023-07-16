import parseStringPromise from 'xml2js';

export default async function (req, res) {
  try {
    const response = await fetch("http://api.wolframalpha.com/v2/query?" + new URLSearchParams({
      appid: process.env.WOLFRAM_ALPHA_APPID,
      input: "What's the weather in " + req.query.location,
      format: "plaintext",
      includepodid: "InstantaneousWeather:WeatherData"
    }), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const textData = await response.text();
    if (response.status !== 200) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Convert the XML data to a JavaScript object
    const data = await parseStringPromise.parseStringPromise(textData);
    if (!data.queryresult || !data.queryresult.pod || data.queryresult.pod.length === 0) {
      return "No response.";
    } else {
      // Output the result
      res.status(200).json({
        result: {
          weather : data.queryresult.pod[0].subpod[0].plaintext[0]
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: {
        message : error
      },
    });
  }
}
