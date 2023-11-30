import parseStringPromise from 'xml2js';

export default async function getWeather(paramObject) {
  const location = paramObject.location;
  if (!location) return "Invalid location.";

  const response = await fetch("http://api.wolframalpha.com/v2/query?" + new URLSearchParams({
      appid: process.env.WOLFRAM_ALPHA_APPID,
      input: "What's the weather in " + location,
      format: "plaintext",
      units: "metric"
    }) + "&includepodid=InstantaneousWeather:WeatherData"  // current weather
      + "&includepodid=WeatherForecast:WeatherData"        // forecast
  , {
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
    let weathers = "";
    data.queryresult.pod.map((pod) => {
      if (pod.$.id === "InstantaneousWeather:WeatherData") {
        weathers += "Current weather is \"" + pod.subpod[0].plaintext[0] + "\".";
      }

      if (pod.$.id === "WeatherForecast:WeatherData") {
        pod.subpod.map((subpod) => {
          weathers += subpod["$"]["title"] + " forecast weather is \"" + subpod.plaintext[0] + "\".";
        });
      }
    });
    return weathers;
  }
}
