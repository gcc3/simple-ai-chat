import { getUserSessions } from "utils/sqliteUtils";

export default async function (req, res) {
  const { user } = req.query;

  try {
    let sessionlines = "";
    const sessions = await getUserSessions(user);
    sessionlines = sessions.map(l => {
      return "S=" + l.session;
    }).join('\n');

    // Output the result
    res.status(200).json({
      result: {
        sessions: sessionlines,
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
