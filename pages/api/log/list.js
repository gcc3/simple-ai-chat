import { loglist } from "../utils/logUtils";

export default async function (req, res) {
  try {
    const logs = loglist(req.query.query_id);

    // Output the result
    res.status(200).json({
      result: {
        logs: logs,
      },
    });
  } catch (error) {
    console.error(error);

    // Consider adjusting the error handling logic for your use case
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
