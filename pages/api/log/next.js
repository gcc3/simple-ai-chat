import { getSessionLog } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";

export default async function (req, res) {
  try {
    // Check if the method is GET
    if (req.method !== "GET") {
      return res.status(405).end();
    }

    const { session, time } = req.query;

    // Authenticate user
    const authResult = authenticate(req);
    if (!authResult.success) {
      res.status(401).json({
        success: false,
        message: "Authentication failed.",
        error: authResult.error,
      });
      return;
    }

    // Verify user's permission for the log
    if (authResult.user.role !== "root_user") {
      const sessionLog = await getSessionLog(session);
      if (sessionLog && sessionLog.user !== authResult.user.username) {
        res.status(401).json({
          success: false,
          message: "Permission denied.",
          error: "Permission denied."
        });
        return;
      }
    }
    
    // Get the log
    const log = await getSessionLog(session, time, ">");

    // Output the result
    res.status(200).json({
      success: true,
      result: {
        log,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
