import { authenticate } from "utils/authUtils";
import { logadd } from "utils/logUtils";

export default async function (req, res) {
   // Check method
   if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { time: time_, session, model, input, output, images } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const browser = req.headers['user-agent'];

    // Time
    let time = Number(time_);

    // Only login user allow to add
    // Authenticate user
    const authResult = authenticate(req);
    if (!authResult.success) {
      res.status(401).json({
        success: false,
        error: authResult.error,
      });
      return;
    }
    
    // Get user
    const user = authResult.user;

    // Add log
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
