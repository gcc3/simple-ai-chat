export function getBaseURL(url) {
  const urlObj = new URL(url);
  return urlObj.origin;
}
