import fs from 'fs';
import { getLogs, insertLog } from "./sqliteUtils.js"
import { authenticate } from './authUtils.js';

export function logadd(log, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];

  // Get user
  let username = "";
  let { success, user } = authenticate(req);
  if (success) username = user.username;

  // Create log
  log = log.replaceAll("\n", "###RETURN###") + " USER=" + username + " IP=" + ip + " BSR=" + browser;

  // Filter log
  if (logfilter(log, "USER")) return;
  if (logfilter(log, "IP")) return;

  const mTime = log.match(/T=(\d+)/);
  const mSession = log.match(/S=(\d+)/);
  const time = mTime ? mTime[1] : null;
  const session = mSession ? mSession[1] : null;
  insertLog(time, session, username, ip, browser, log);
}

export async function loglist(session, maxLogCount = 30) {
  let loglines = "";
  if (!session) return loglines;  // don't show anything if no queryId is given

  const logs = await getLogs(session);
  loglines = logs.map(e => {
    const line = e.log.replaceAll("###RETURN###", " ");

    // remove USER, IP and BSR (browser) info in the log output
    if (!line.includes("USER=")) return line;
    else return line.substring(0, line.search("USER="))
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
