import fs from 'fs';
import path from 'path';
import { getLogs, insertLog } from "./sqliteUtils.js"

export function logadd(log, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];
  log = log.replaceAll("\n", "###RETURN###") + " IP=" + ip + " BSR=" + browser;

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
    insertLog(time, session, log);
  }
}

export async function loglist(queryId, maxLogCount = 30) {
  let loglines = "";

  if (process.env.DB == "file") {
    const log = fs.readFileSync('./log.txt', 'utf8')
                .replaceAll("###RETURN###", " ");

    // only show last 10 lines with an IP filter
    loglines = log.split("\n")
      .filter(line => ((queryId && queryId !== "" && line.includes("S=" + queryId)) || !queryId))  // filter by queryId
      .filter(line => queryId || logfilter(line, "IP"))  // filter by IP
      .reverse()  // reverse order
      .slice(0, maxLogCount);  // only show last x lines

    // remove IP and browser info in the log output
    loglines = loglines.map(line => {
      if (!line.includes("IP=")) return line;
      else return line.substring(0, line.search("IP="))
    }).join("\n");
  }

  if (process.env.DB == "sqlite") {
    const logs = await getLogs(queryId);
    loglines = logs.map(e => e.log).join('\n');
  }
  
  return loglines;
}

function logfilter(line, indicater) {
  if (line === "") return false;
  
  // filter with rules
  const rules = fs.readFileSync('./log.config', 'utf8').split("\n");
  for (const rule of rules) {
    if (rule.startsWith(indicater)) {
      const ruleValue = rule.substring(indicater.length + 1).trim();
      if (line.includes(ruleValue)) {
        return false;
      }
    }
  }
  return true;
}
