export default async function redirectToUrl(paramObject) {
  let url = paramObject.url;
  if (!url) return "Please provide a URL to redirect to.";
  return {
    event: {
      name: "redirect",
      parameters: {
        url,
      },
    }
  };
}
