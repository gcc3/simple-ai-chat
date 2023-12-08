import { loglist } from "utils/logUtils";

export default async function (req, res) {
  try {
    const session = req.query.query_id;
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
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
