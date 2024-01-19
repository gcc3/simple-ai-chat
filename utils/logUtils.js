import { getLogs, getSession, getLog, insertLog, insertSession } from "./sqliteUtils.js"

export async function logadd(user, sessionId, time, model, input_token_ct, input, output_token_ct, output, images, ip, browser) {
  // Get username
  let username = "";
  if (user) {
    username = user.username;
  }

  // Insert log
  await insertLog(sessionId, time, username, model, input_token_ct, input, output_token_ct, output, images, ip, browser);
}

export async function loglist(sessionId, limit = 50) {
  let loglines = [];

  // Get current session logs
  let session = await getSession(sessionId);
  if (!session) {
    return loglines;
  }
  loglines = await getLogs(sessionId, limit);

  if (loglines.length >= limit) return loglines;

  // Get parent session logs
  while (session) {
    if (session.id == session.parent_id) {
      // Root session, break
      break;
    }

    // Set branch point
    const branchPoint = session.id;

    // Go to parent session
    session = await getSession(session.parent_id);

    // Get parent session logs
    const logs = await getLogs(session.id, limit);

    for (let i = 0; i < logs.length; i++) {
      if (loglines.length >= limit) return loglines;

      // Add log
      if (logs[i].time <= branchPoint)
        loglines.push(logs[i]);
    }
  }
  
  return loglines;
}

export async function ensureSession(sessionId, username = "") {
  // If session is a log time, then it is a subssion
  // If not then it is a root session
  if ((await getLogs(sessionId, 1)).length == 0) {
    let parentId = sessionId;  // for root session

    const time = sessionId;
    const log = await getLog(time)
    if (log) {
      parentId = log.session;  // for sub session
    }

    // Insert a session
    await insertSession(sessionId, parentId, username);
  }
}