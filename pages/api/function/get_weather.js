import parseStringPromise from 'xml2js';

export default async function (req, res) {
  try {
    res.status(200).json({
      result: {
        weather : await getWeather(req.query.location)
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: {
        message : error
      },
    });
  }
}

export async function getWeather(location) {
  const response = await fetch("http://api.wolframalpha.com/v2/query?" + new URLSearchParams({
    appid: process.env.WOLFRAM_ALPHA_APPID,
    input: "What's the weather in " + location,
    format: "plaintext",
    units: "metric",
    includepodid: "InstantaneousWeather:WeatherData"
  }), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const responseText = await response.text();
  const data = await parseStringPromise.parseStringPromise(responseText);  // XML to object
  if (!data.queryresult || !data.queryresult.pod || data.queryresult.pod.length === 0) {
    return "No response.";
  } else {
    return data.queryresult.pod[0].subpod[0].plaintext[0]  // weather
  }
}
