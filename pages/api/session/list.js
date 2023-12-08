import { getSessions, getSessionLog } from "utils/sqliteUtils";

export default async function (req, res) {
  try {
    let sessions = {};
    const sessionIds = await getSessions();
    await Promise.all(sessionIds.map(async (s) => {
      const l = await getSessionLog(s.session);
      sessions[s.session] = "U=" + l.user + " I=" + l.input.substring(0, Math.min(l.input.length, 50));
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
