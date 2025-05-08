import { getLogs, getSession } from "utils/sqliteUtils";


// Get session log
export async function getSessionLog(direction = "prev", initId, time, limit = 50) {
  let session = await getSession(initId);
  if (!session) return null;

  // Comparison functions for direction
  const compare = direction === "prev"
    ? (logTime, refTime) => logTime < refTime      // Before time
    : (logTime, refTime) => logTime > refTime;     // After time

  // Find log in current session
  let foundLog = null;
  const logs = await getLogs(session.id, limit);

  for (const l of logs) {
    if (compare(l.time, time)) {
      if (!foundLog) {
        foundLog = l; // first found is closest due to getLogs order, typically descending/ascending
      } else {
        // For "prev", want the largest time < given; for "next", want the smallest time > given
        foundLog = (direction === "prev")
          ? (l.time > foundLog.time ? l : foundLog)
          : (l.time < foundLog.time ? l : foundLog);
      }
    }
  }

  // Go through parent sessions if not found
  while (!foundLog && session && session.parent_id && session.id != session.parent_id) {
    const branchPoint = session.id;
    session = await getSession(session.parent_id);
    if (!session) break;

    const parentLogs = await getLogs(session.id, limit);
    for (const l of parentLogs) {
      if (compare(l.time, time) && l.time <= branchPoint) {
        if (!foundLog) {
          foundLog = l;
        } else {
          foundLog = (direction === "prev")
            ? (l.time > foundLog.time ? l : foundLog)
            : (l.time < foundLog.time ? l : foundLog);
        }
      }
    }
  }

  return foundLog;
}