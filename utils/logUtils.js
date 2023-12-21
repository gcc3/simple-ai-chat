import { getLogs, insertLog } from "./sqliteUtils.js"

const fs = require('fs');

export function logadd(user, session, model, input_token_ct, input, output_token_ct, output, ip, browser) {
  // Filter out logs
  if (logfilter(output, "USER")) {
    console.log("Log ignored (USER).\n");
    return;
  }
  if (logfilter(output, "IP")) {
    console.log("Log ignored (IP).\n");
    return;
  }

  // Get username
  let username = "";
  if (user) {
    username = user.username;
  }

  // Insert log
  insertLog(session, username, model, input_token_ct, input, output_token_ct, output, ip, browser);
}

export async function loglist(session, limit = 50) {
  let loglines = "";
  if (!session) return loglines;  // don't show anything if no queryId is given
  return await getLogs(session, limit);
}

function logfilter(line, indicater) {
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
