const moment = require('moment');

export function formatUnixTimestamp(unixTime) {
  // If unixTime is a string, convert it to a number
  if (typeof unixTime === 'string') {
    unixTime = Number(unixTime);
  }

  // Use moment.utc() to create a moment in UTC with the Unix timestamp (in seconds)
  return moment.utc(unixTime).format('MM/DD/YYYY HH:mm:ss');
}
