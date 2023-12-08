export default async function redirectToUrl(paramObject) {
  const url = paramObject.url;
  const blank = paramObject.blank;
  if (!url) return "Please provide a URL to redirect to.";
  return {
    message: "Redirected to " + url + " successfully." + " Please don't need to redirect again.",  // It's actually redirecting but AI required to be told it is redirected
    event: { name: "redirect", parameters: { url, blank }, },
  };
}
