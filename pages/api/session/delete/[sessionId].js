import { deleteSession } from "utils/sqliteUtils";

export default async function (req, res) {
  const { sessionId } = req.query;

  try {
    await deleteSession(sessionId);

    // Output the result
    res.status(200).json({
      result: {
        success: true,
        message: "Session deleted."
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
