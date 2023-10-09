export function generateSettings(format="json") {
  let newSettings = {};
  
  // Default settings
  newSettings["role"] = "";
  newSettings["theme"] = "light";
  newSettings["speak"] = "off";
  newSettings["stats"] = "on";

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
