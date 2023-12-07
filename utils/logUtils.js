import { getLogs, insertLog } from "./sqliteUtils.js"
import { authenticate } from './authUtils.js';

const fs = require('fs');

export function logadd(session, input, output, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];

  // Get user
  let username = "";
  let { success, user } = authenticate(req);
  if (success) username = user.username;

  // Create log
  output = output.replaceAll("\n", "###RETURN###");

  // Filter out logs
  if (logfilter(output, "USER")) return;
  if (logfilter(output, "IP")) return;

  // Insert log
  insertLog(session, username, input, output, ip, browser);
}

export async function loglist(session, limit = 50) {
  let loglines = "";
  if (!session) return loglines;  // don't show anything if no queryId is given

  const logs = await getLogs(session, limit);
  loglines = logs.map(l => {
    return "T=" + l.time + " " + "S=" + l.session 
    + " I=" + l.input.replaceAll("###RETURN###", " ") 
    + " O=" + l.output.replaceAll("###RETURN###", " ");
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
