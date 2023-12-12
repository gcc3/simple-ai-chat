import { getLogs, insertLog } from "./sqliteUtils.js"
import { authenticate } from './authUtils.js';

const fs = require('fs');

export function logadd(session, model, input, output, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];

  // Get user
  let username = "";
  let { success, user } = authenticate(req);
  if (success) username = user.username;

  // Filter out logs
  if (logfilter(output, "USER")) return;
  if (logfilter(output, "IP")) return;

  // Insert log
  insertLog(session, username, model, input, output, ip, browser);
}

export async function loglist(session, limit = 50) {
  let loglines = "";
  if (!session) return loglines;  // don't show anything if no queryId is given
  return await getLogs(session, limit);
}

function logfilter(line, indicater) {
  if (line === "") return true;
  
  // filter with rules
  const rules = fs.readFileSync('./log.config', 'utf8').split("\n");
  for (const rule of rules) {
    if (rule.startsWith(indicater)) {
      const ruleValue = rule.substring(indicater.length + 1).trim();
      if (line.includes(ruleValue)) {
        console.log("Log ignored (" + indicater + " = " + ruleValue + ").\n");
        return true;
      }
    }
  }
  return false;
}
