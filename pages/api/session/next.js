import { countLogs, getNextSession, getSessionLogs } from "utils/sqliteUtils";

export default async function (req, res) {
  const { sessionId: id, user: createdBy } = req.query;

  try {
    // Check if role exists in user roles
    const session = await getNextSession(id, createdBy);
    if (!session) {
      return res.status(200).json({ 
        success: false,
        message: "No next session found."
      });
    }

    // Get session length
    session.length = await countLogs(session.id);

    // Get session logs
    session.logs = await getSessionLogs(session.id);

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
