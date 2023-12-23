export default async function redirectToUrl(paramObject) {
  const url = paramObject.url;
  const blank = paramObject.blank;
  if (!url) {
    return {
      success: false,
      error: "Please provide a URL."
    }
  }

  if (!url.startsWith("http")) {
    return {
      success: false,
      error: "Please provide a URL starts with `http`."
    }
  }

  if (blank === undefined) {
    return {
      success: false,
      error: "Please provide a blank parameter."
    }
  }

  if (blank !== true && blank !== false) {
    return {
      success: false,
      error: "Please provide a blank parameter as true or false."
    }
  }

  let blankMessage = "";
  if (blank) blankMessage = " Brower opened URL in a new tab";
  return {
    success: true,
    message: "Browser is redirected to `" + url + "`." + blankMessage,
    event: { name: "redirect", parameters: { url, blank }, },
  };
}
