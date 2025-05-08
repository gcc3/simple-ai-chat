import { getSessionLog } from "utils/branchUtils";


export default async function (req, res) {
  try {
    // Check method
    if (req.method !== "GET") {
      return res.status(405).end();
    }

    const { session: initId, time } = req.query;

    const log = await getSessionLog("next", initId, time);
    if (log) {
      return res.status(200).json({
        success: true,
        result: {
          log,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No next log found.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
