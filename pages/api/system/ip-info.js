import { getIpInfo } from "utils/ipUtils";

export default async function (req, res) {
  if (process.env.USE_IPINFO !== "true") {
    return res.status(200).json({
      error: {
        message: "IP info is not enabled.",
      },
    });
  }

  if (process.env.IPINFO_TOKEN === undefined) {
    return res.status(500).json({
      error: {
        message: "IP info token is not set.",
      },
    });
  }

  try {
    // configurations
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("IP is:" + ip);

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
