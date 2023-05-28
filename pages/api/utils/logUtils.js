import fs from 'fs';

export function logfile(log) {
  fs.appendFile('./log.txt', log + '\n', function (err) {
    if (err) throw err;
  });
}
