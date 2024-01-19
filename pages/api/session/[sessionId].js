import { getSession } from "utils/sqliteUtils";

export default async function (req, res) {
  const { sessionId: id } = req.query;

  try {
    // Check if role exists in user roles
    const session = await getSession(id);
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: "Session is empty."
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        session: session,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request."
    });
  }
}
