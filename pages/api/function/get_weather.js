import getWeather from "functions/get_weather.js";

export default async function (req, res) {
  try {
    res.status(200).json({
      result: {
        weather: await getWeather(req.query.location)
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
