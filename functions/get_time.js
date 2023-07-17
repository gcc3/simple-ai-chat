export default async function getTime(timeZone="UTC") {
  return new Date().toLocaleString('en-US', { timeZone: timeZone });
}
