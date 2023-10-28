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

  // Add log
  if (process.env.DB == "file") {
    fs.appendFile('./log.txt', log + '\n', function (err) {
      if (err) throw err;
    });
  }

  if (process.env.DB == "sqlite") {
    const mTime = log.match(/T=(\d+)/);
    const mSession = log.match(/S=(\d+)/);
    const time = mTime ? mTime[1] : null;
    const session = mSession ? mSession[1] : null;
    insertLog(time, session, username, log);
  }
}

export async function loglist(queryId, maxLogCount = 30) {
  let loglines = "";
  if (!queryId) return loglines;  // don't show anything if no queryId is given

  if (process.env.DB == "file") {
    const log = fs.readFileSync('./log.txt', 'utf8')
                .replaceAll("###RETURN###", " ");

    // only show last x lines with an IP filter
    loglines = log.split("\n")
      .filter(line => ((queryId && queryId !== "" && line.includes("S=" + queryId)) || !queryId))  // filter by queryId
      .reverse()  // reverse order
      .slice(0, maxLogCount);  // only show last x lines

    // remove USER, IP and BSR (browser) info in the log output
    loglines = loglines.map(line => {
      if (!line.includes("USER=")) return line;
      else return line.substring(0, line.search("USER="))
    }).join("\n");
  }

  if (process.env.DB == "sqlite") {
    const logs = await getLogs(queryId);
    loglines = logs.map(e => {
      const line = e.log.replaceAll("###RETURN###", " ");

      // remove USER, IP and BSR (browser) info in the log output
      if (!line.includes("USER=")) return line;
      else return line.substring(0, line.search("USER="))
    }).join('\n');
  }
  
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
        console.log("Log ignored as " + indicater + " = " + ruleValue + ".");
        return true;
      }
    }
  }
  return false;
}
