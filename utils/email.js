export function verifyEmailAddress(email) {
  // Check if the email is valid.
  if (!email.includes('@')) {
    return false;
  }
  const emailParts = email.split('@');
  if (emailParts.length !== 2 || emailParts[0].length === 0 || emailParts[1].length === 0) {
    return false;
  }
  return true;
}

export async function evalEmailAddress(email) {
  // Safe domain no check
  const safeEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "yahoo.co.jp",
    "outlook.com",
    "hotmail.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "msn.com",
    "live.com",
    "ymail.com",
    "zoho.com",
    "protonmail.com",
    "gmx.com",
    "me.com",
    "comcast.net",
    "sbcglobal.net",
    "att.net",
    "verizon.net",
    "bellsouth.net",
    "rocketmail.com",
    "yandex.com",
    "hushmail.com",
    "aim.com",
    "rediffmail.com",
    "mail.ru",
    "fastmail.com",
    "lycos.com",
    "qq.com",
    "163.com",
    "126.com",
    "sina.com",
    "inbox.com",
    "blueyonder.co.uk"
  ];
  if (safeEmailDomains.some(domain => email.endsWith(domain))) {
    return {
      success: true,
    };
  }

  if (!process.env.HUNTER_API_KEY) {
    console.warn("Hunter API key not found.");
    return {
      success: true,
    };
  }

  // Use hunter.io API to check if the email is valid.
  try {
    const response = await fetch("https://api.hunter.io/v2/email-verifier?email=" + email + "&api_key=" + process.env.HUNTER_API_KEY);
    
    const data = await response.json();
    if (response.status !== 200) {
      // Hunter api will not return `error`, instead it using `errors`.
      throw data.errors || new Error(`Request failed with status ${response.status}`);
    }

    if (data.data.result !== "deliverable" || data.data.score < 50) {
      return {
        success: false,
        error: "The email address provided does not meet our verification standards. Please use a different email address to proceed with the registration.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Email evaluation not working:", error);
    if (error) {
      return {
        success: false,
        error: error[0].details,
      };
    } else {
      return {
        success: true,
        error: "Email evaluation not working.",
      };
    }
  }
}

export function getRedirectableHtml(message) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="3;url=/" />
      <title>simple ai - chat</title>
      <link rel="stylesheet" href="https://code.cdn.mozilla.net/fonts/fira.css">
      <style>
        body { 
          font-size: 16px;
          font-family: "Fira Mono", "Fira Code VF", "ColfaxAI", "PingFang SC", "Microsoft Yahei", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
        }
      </style>
    </head>
    <body>
      ${message}<br />
      Redirecting in 3 seconds...
    </body>
    </html>
  `;
}