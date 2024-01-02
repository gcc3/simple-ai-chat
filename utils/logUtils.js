import { isPageStatic } from "next/dist/build/utils.js";
import { getLogs, insertLog } from "./sqliteUtils.js"

const fs = require('fs');

export async function logadd(user, session, model, input_token_ct, input, output_token_ct, output, images, ip, browser) {
  // Get username
  let username = "";
  if (user) {
    username = user.username;
  }

  // Insert log
  await insertLog(session, username, model, input_token_ct, input, output_token_ct, output, images, ip, browser);
}

export async function loglist(session, limit = 50) {
  let loglines = "";
  if (!session) return loglines;  // don't show anything if no session is given
  return await getLogs(session, limit);
}
