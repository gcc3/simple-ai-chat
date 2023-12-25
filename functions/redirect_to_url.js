export default async function redirectToUrl(paramObject) {
  const url = paramObject.url;
  let blank = paramObject.blank;
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
    blank = true;  // by default, open in a new tab
  } else if (blank !== true && blank !== false) {
    return {
      success: false,
      error: "Please provide a blank parameter as true or false."
    }
  }

  let message = "";
  if (blank) message = "The browser has been redirected to `" + url + "` and has opened in a new tab.";
  else message = "The browser has been redirected to `" + url;
  return {
    success: true,
    message: message,
    event: { name: "redirect", parameters: { url, blank }, },
  };
}
