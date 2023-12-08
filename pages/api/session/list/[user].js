import { getSessionLog, getUserSessions } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";

export default async function (req, res) {
  const { user } = req.query;

  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed.',
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;
  if (user !== username) {
    return res.status(403).json({ 
      success: false,
      message: 'Permission denied.',
    });
  }

  try {
    let sessions = {};
    const sessionIds = await getUserSessions(username);  // max 20 sessions
    await Promise.all(sessionIds.map(async (s) => {
      const l = await getSessionLog(s.session);
      sessions[s.session] = "I=" + l.input.substring(0, Math.min(l.input.length, 30));
    }));

    // Output the result
    res.status(200).json({
      success: true,
      result: {
        sessions,
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
