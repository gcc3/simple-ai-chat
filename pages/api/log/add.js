import { authenticate } from "utils/authUtils";
import { logadd } from "utils/logUtils";

export default async function (req, res) {
   // Check method
   if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { user, time: time_, session, model, input, output, images } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const browser = req.headers['user-agent'];

    // Time
    let time = Number(time_);
    
    // Add log
    // TODO, should only allow login user add log, else will be injected
    await logadd(user, session, time, model, 0, input, 0, output, JSON.stringify(images), ip, browser);

    // Output the result
    res.status(200).json({
      result: {
        success: true,
        message: "Log added.",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
