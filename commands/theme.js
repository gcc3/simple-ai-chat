import { getSetting, setSetting } from "../utils/settingsUtils.js";
import { updateUserSetting } from "../utils/userUtils.js";


export default async function theme(args) {
  const value = args[0];
  
  if (value !== "light" && value !== "dark" && value !== "terminal") {
    return "Usage: :theme [light/dark/terminal]";
  }

  // Update local setting
  setSetting('theme', value);

  // There is user logged in
  // Update remote setting
  if (getSetting("user")) {
    await updateUserSetting("theme", value);
  }

  return;
}
