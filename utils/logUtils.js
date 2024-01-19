import { getLogs, getSession, getLog, insertLog, insertSession } from "./sqliteUtils.js"

export async function logadd(user, session, time, model, input_token_ct, input, output_token_ct, output, images, ip, browser) {
  // Get username
  let username = "";
  if (user) {
    username = user.username;
  }

  // Insert a session
  // If session is a log time, then it is a subssion
  // If not then it is a root session
  if ((await getLogs(session, 1)).length == 0) {
    let parent = session;

    const time = session;
    const log = await getLog(time)
    if (log) {
      // This has a subsession
      parent = log.session;
    }

    await insertSession(session, parent, username);
  }

  // Insert log
  await insertLog(session, time, username, model, input_token_ct, input, output_token_ct, output, images, ip, browser);
}

export async function loglist(initId, limit = 50) {
  let loglines = [];

  // Get current session logs
  let session = await getSession(initId);
  if (!session) {
    return loglines;
  }
  loglines = await getLogs(initId, limit);

  if (loglines.length >= limit) {
    // Limit reached, return
    return loglines;
  }

  // Get parent session logs
  while (session) {
    if (session.id == session.parent_id) {
      // Root session, break
      break;
    }

    if (loglines.length >= limit) {
      // Limit reached, break
      break;
    }

    // Go to parent session
    session = await getSession(session.parent_id);

    // Get parent session logs
    const logs = await getLogs(session.id, limit);
    loglines = logs.concat(loglines);
  }
  return 
}
