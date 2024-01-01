import { loglist } from "utils/logUtils";
import { authenticate } from "utils/authUtils";
import { getSessionLog } from "utils/sqliteUtils";

export default async function (req, res) {
  try {
    const session = req.query.session;

    // Authenticate user
    const authResult = authenticate(req);
    if (!authResult.success) {
      res.status(401).json({
        success: false,
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
          error: "Permission denied."
        });
        return;
      }
    }

    // Get the logs
    const logs = await loglist(session);

    // Output the result
    res.status(200).json({
      result: {
        logs: logs.length > 0 ? JSON.stringify(logs, null, 2) : "No logs found.",
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
