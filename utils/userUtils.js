export function generateSettings(format="json", role="", theme="light", speak="off", stats="on") {
  let newSettings = {};
  
  // Default settings
  newSettings["role"] = role;
  newSettings["theme"] = theme;
  newSettings["speak"] = speak;
  newSettings["stats"] = stats;

  if (format === "json") {
    return JSON.stringify(newSettings);
  }
  return newSettings;
}

export function generatePassword(length=8) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Check user login status
export async function checkLoginStatus() {
  let user = null;
  const response = await fetch(`/api/user/status`, {
    method: "GET",
    credentials: 'include',
  });
  const data = await response.json();
  user = data.user;

  if (user) {
    localStorage.setItem("user", user.username);
    localStorage.setItem("userSettings", user.settings);
  } else {
    if (localStorage.getItem("user")) {
      localStorage.removeItem("user");
      localStorage.removeItem("userSettings");

      // Clear auth cookie
      document.cookie = "auth=; Path=/;";
      console.log("User authentication failed, local user data cleared.");
    }
  }
}