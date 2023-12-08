import { loglist } from "utils/logUtils";
import { authenticate } from "utils/authUtils";
import { getSessionLog } from "utils/sqliteUtils";

export default async function (req, res) {
  try {
    const session = req.query.query_id;

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
    console.log(authResult.user.role);
    if (authResult.user.role !== "root_user") {
      console.log(session);
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
      message: "An error occurred during your request.",
      error: error,
    });
  }
}
