import { getSessionLog } from "utils/sqliteUtils";

export default async function (req, res) {
  try {
    // Check if the method is GET
    if (req.method !== "GET") {
      return res.status(405).end();
    }

    const { session, time } = req.query;
    
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
