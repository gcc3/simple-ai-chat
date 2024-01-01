import { getSessionLog, getUserSessions } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";

export default async function (req, res) {
  const { user } = req.query;

  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;
  if (user !== username) {
    return res.status(403).json({ 
      success: false,
      error: 'Permission denied.',
    });
  }

  try {
    let sessions = {};
    const sessionIds = await getUserSessions(username);  // max 20 sessions
    await Promise.all(sessionIds.map(async (s) => {
      const l = await getSessionLog(s.session);
      if (l) {
        sessions[s.session] = "I=" + l.input.substring(0, Math.min(l.input.length, 30));
      }
    }));

    // Sort sessions
    const sessionsArray = Object.entries(sessions);  // Convert the sessions object into an array of [key, value] pairs
    const sortedSessionsArray = sessionsArray.sort((a, b) => {
      return b[0].localeCompare(a[0]);
    });  // Sort the sessions array by key (session ID) in descending order
    const sortedSessions = sortedSessionsArray.reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});  // Convert the sorted sessions array back into an object

    // Output the result
    res.status(200).json({
      success: true,
      result: {
        sessions: sortedSessions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
