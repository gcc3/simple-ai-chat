export function getBaseURL(url) {
  const urlObj = new URL(url);
  return urlObj.origin;
}

const URL_PATTERN = new RegExp(
  '^' +
    // protocol
    '(https?:\\/\\/)' +
    // domain name (subdomains allowed)
    '((?:[a-z\\d](?:[a-z\\d-]*[a-z\\d])?\\.)+[a-z]{2,}|' +
      // OR IPv4
      '\\d{1,3}(?:\\.\\d{1,3}){3})' +
    // optional port
    '(?::\\d{1,5})?' +
    // path
    '(?:\\/[\\-a-z\\d%_.~+]*)*' +
    // query string
    '(?:\\?[;&a-z\\d%_.~+=-]*)?' +
    // fragment locator
    '(?:\\#[-a-z\\d_]*)?' +
  '$',
  'i'
);

export function isUrl(text) {
  if (typeof text !== 'string') {
    return false;
  }

  // Primary check: use the URL constructor for accurate parsing
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Fallback: test against the regex for environments without URL support
    return URL_PATTERN.test(text);
  }
}
