import fs from 'fs';

export function logfile(log, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];
  log = log.replaceAll("\n", "###RETURN###") + " IP=" + ip + " BSR=" + browser;
  fs.appendFile('./log.txt', log + '\n', function (err) {
    if (err) throw err;
  });
}

export function loglist() {
  let log = fs.readFileSync('./log.txt', 'utf8');
  
  // only show last 10 lines
  log = log.split("\n").slice(-10).join("\n\n")
         .replaceAll("###RETURN###", " ");

  // For each line, remove IP and BSR
  log = log.split("\n").map(line => {
    if (line.includes("IP=")) {
      return line.substring(0, line.indexOf("IP=") - 1);
    } else {
      return line;
    }
  }).join("\n");

  return log;
}
