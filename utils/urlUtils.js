export function getQueryParameterValue(url, paramName) {
  const urlObj = new URL(url);
  
  const params = new URLSearchParams(urlObj.search);
  const paramValue = params.get(paramName);
  
  // If the parameter exists, convert it to a float and return
  if (paramValue !== null) {
    return paramValue;
  }
  
  return null;
}

export function getBaseURL(url) {
  const urlObj = new URL(url);
  return urlObj.origin;
}
