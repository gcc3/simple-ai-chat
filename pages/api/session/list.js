import { listSessions } from "utils/sessionUtils";

export default async function (req, res) {
  try {
    const sessions = await listSessions();

    // Output the result
    res.status(200).json({
      result: {
        sessions,
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
