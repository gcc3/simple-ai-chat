import fs from 'fs';
import { type } from 'os';

export function logfile(log, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];
  log = log.replaceAll("\n", "###RETURN###") + " IP=" + ip + " BSR=" + browser;
  fs.appendFile('./log.txt', log + '\n', function (err) {
    if (err) throw err;
  });
}

export function loglist(queryId, maxLogCount = 20) {
  const log = fs.readFileSync('./log.txt', 'utf8')
               .replaceAll("###RETURN###", " ");

  // only show last 10 lines with an IP filter
  let loglines = log.split("\n")
    .filter(line => ((queryId && queryId !== "" && line.includes("S=" + queryId)) || !queryId))  // filter by queryId
    .filter(line => logfilter(line, "IP"))  // filter by IP
    .reverse()  // reverse order
    .slice(maxLogCount * -1);  // only show last x lines

  // remove IP and browser info in the log output
  loglines = loglines.map(line => {
    if (!line.includes("IP=")) return line;
    else return line.substring(0, line.search("IP="))
  }).join("\n");
  
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
