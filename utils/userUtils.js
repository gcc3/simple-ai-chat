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
