import { getLogs, getSession } from "utils/sqliteUtils";

export default async function (req, res) {
  try {
    // Check if the method is GET
    if (req.method !== "GET") {
      return res.status(405).end();
    }

    const { session: initId, time } = req.query;

    let session = await getSession(initId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found.",
      });
    }

    // Find in current session
    let log = null;
    const logs = await getLogs(session.id, 1000);
    logs.map((l) => {
      if (l.time > time) {
        log = l;
      }
    });
    
    if (!log) {
      res.status(404).json({
        success: false,
        error: "Log not found.",
      });
    }

    // Find in parent sessions
    while (session) {
      if (session.id == session.parent_id) {
        // Root session, break
        break;
      }

      // Set branch point
      const branchPoint = session.id;

      // Go to parent session
      session = await getSession(session.parent_id);

      // Find the earliest log
      const logs = await getLogs(session.id, 1000);
      logs.map((l) => {
        if (l.time > time && l.time <= branchPoint) {
          log = l;
        }
      });
    }

    if (log) {
      // Output the result
      res.status(200).json({
        success: true,
        result: {
          log,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Log not found.",
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
