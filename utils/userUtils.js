export function generateSettings(format="json") {
  let newSettings = {};
  
  // Default settings
  newSettings["role"] = localStorage.getItem("role");
  newSettings["theme"] = localStorage.getItem("theme");
  newSettings["speak"] = localStorage.getItem("useSpeak") === "true" ? "on" : "off";
  newSettings["stats"] = localStorage.getItem("useStats") === "true" ? "on" : "off";

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
