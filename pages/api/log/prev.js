import { getSessionLog, getLogs, getSession } from "utils/sqliteUtils";

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
        error: "Log not found.",
      });
    }
    const sessionBranchPoint = session.id;

    let log = null;

    // The current session
    // Get the log
    log = await getSessionLog(session.id, time, "<");
    if (log) {
      // Output the result
      res.status(200).json({
        success: true,
        result: {
          log,
        },
      });
      return;
    }

    // The first parent
    session = await getSession(session.parent_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Log not found.",
      });
    }
    const logs = await getLogs(session.id, 1000);
    logs.map((l) => {
      if (l.time < time && l.time <= sessionBranchPoint) {
        log = l;

        // Output the result
        res.status(200).json({
          success: true,
          result: {
            log,
          },
        });
        return;
      }
    });

    // From the first parent's next parent to the root
    while (session) {
      // Get the log
      const log = await getSessionLog(session.id, time, "<");
      if (log) {
        // Output the result
        res.status(200).json({
          success: true,
          result: {
            log,
          },
        });
        return;
      } else {
        if (session.id == session.parent_id) {
          // Root session, break
          break;
        }

        // Go to parent session
        session = await getSession(session.parent_id);
      }
    }

    res.status(404).json({
      success: false,
      error: "Log not found.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
