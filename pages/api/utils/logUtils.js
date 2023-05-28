import fs from 'fs';

export function logfile(log, req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];
  log = log + "\nIP=" + ip + "\nBSR=" + browser;
  fs.appendFile('./log.txt', log + '\n\n', function (err) {
    if (err) throw err;
  });
}
