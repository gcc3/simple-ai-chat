import { getLogs, getLog, insertLog, insertSession } from "./sqliteUtils.js"

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

export async function loglist(session, limit = 50) {
  let loglines = "";
  if (!session) return loglines;  // don't show anything if no session is given
  return await getLogs(session, limit);
}
