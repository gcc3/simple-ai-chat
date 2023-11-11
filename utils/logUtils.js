import { getLogs, insertLog } from "./sqliteUtils.js"
import { authenticate } from './authUtils.js';

const fs = require('fs');

export function logadd(session, log, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];

  // Get user
  let username = "";
  let { success, user } = authenticate(req);
  if (success) username = user.username;

  // Create log
  log = log.replaceAll("\n", "###RETURN###");

  // Filter out logs
  if (logfilter(log, "USER")) return;
  if (logfilter(log, "IP")) return;

  // Insert log
  insertLog(session, username, ip, browser, log);
}

export async function loglist(session) {
  let loglines = "";
  if (!session) return loglines;  // don't show anything if no queryId is given

  const logs = await getLogs(session, 7);  // get last 7 logs
  loglines = logs.map(l => {
    return "T=" + l.time + " " + "S=" + l.session + " " + l.log.replaceAll("###RETURN###", " ");
  }).join('\n');
  
  return loglines;
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
