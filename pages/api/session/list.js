import { getSessions, getSessionLog } from "utils/sqliteUtils";

export default async function (req, res) {
  try {
    let sessions = {};
    const sessionIds = await getSessions();
    await Promise.all(sessionIds.map(async (s) => {
      const l = await getSessionLog(s.session, s.session);
      if (l) {
        sessions[s.session] = "U=" + l.user + " I=" + l.input.substring(0, Math.min(l.input.length, 50));
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
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
