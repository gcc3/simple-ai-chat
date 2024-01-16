import { getIpInfo } from "utils/ipUtils";

export default async function (req, res) {
  try {
    // configurations
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipInfo = await getIpInfo(ip);
    const country = ipInfo.country === undefined ? "unknown" : ipInfo.country;
    const city = ipInfo.city === undefined ? "unknown" : ipInfo.city;  // no need

    res.status(200).json({
      result: {
        ip: ip,
        country: country,
        city: city,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
