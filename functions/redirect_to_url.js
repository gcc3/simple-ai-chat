export default async function redirectToUrl(paramObject) {
  const url = paramObject.url;
  const blank = paramObject.blank;
  if (!url) return "Please provide a URL to redirect to.";
  return { 
    message: "Redirecting to \"" + url + "\".",
    event: { name: "redirect", parameters: { url, blank }, },
  };
}