export default async function redirectToUrl(paramObject) {
  const url = paramObject.url;
  const blank = paramObject.blank;
  if (!url) return "Please provide a URL to redirect to.";
  return { 
    message: "Redirected to " + url + " successfully.",
    event: { name: "redirect", parameters: { url, blank }, },
  };
}
