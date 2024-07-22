export function checkUserAgent() {
  const userAgent = window.navigator.userAgent;
  const userAgentLower = userAgent.toLowerCase();

  return {
    userAgent: userAgent,
    isIPhone: userAgent.indexOf('iPhone') !== -1,
    isAndroid: userAgent.indexOf('Android') !== -1,
    isAppleMobile: /(iphone|ipad|ipod)/.test(userAgentLower),
    isSafariOrWebView: /version/.test(userAgentLower),
    isIOSChrome: /crios/.test(userAgentLower),
    isAppleMobileSafari: /(iphone|ipad|ipod).*version/.test(userAgentLower),
    isAppleMobileChrome: /(iphone|ipad|ipod).*crios/.test(userAgentLower)
  };
}
