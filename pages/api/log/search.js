import { authenticate } from "utils/authUtils";
import { searchFromLogs } from "utils/sqliteUtils";

export default async function (req, res) {
  try {
    const keyword = req.query.keyword;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    // Authenticate user
    const authResult = authenticate(req);
    if (!authResult.success) {
      res.status(401).json({
        success: false,
        error: authResult.error,
      });
      return;
    }
    
    // Validate keyword parameter
    if (!keyword) {
      res.status(400).json({
        success: false,
        error: "Keyword parameter is required."
      });
      return;
    }

    // Search the logs
    if (limit > 500) {
      res.status(400).json({
        success: false,
        error: "Limit cannot exceed 500.",
      });
      return;
    }
    const logs = await searchFromLogs(keyword, authResult.user.username, limit);

    // Output the result
    res.status(200).json({
      success: true,
      message: "Search: \"" + keyword + "\"\n"
             + "Matches count: " + logs.length + "\n"
             + "Matches: " + (logs.length > 0 ? JSON.stringify(logs, null, 2) : "(No matches found.)"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
