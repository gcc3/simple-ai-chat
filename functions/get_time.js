import timezone from 'moment-timezone';

export default async function getTime(paramObject) {
  let timeZone = paramObject.timezone;
  if (!timeZone) timeZone = "UTC";

  if (!timezone.tz.names().includes(timeZone)) {
    return "Invalid timezone. Please use one of the following: " + timezone.tz.names().join(", ");
  }
  return {
    message: new Date().toLocaleString('en-US', { timeZone: timeZone })
  };
}
