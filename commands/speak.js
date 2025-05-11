import { getSetting, setSetting } from "../utils/settingsUtils.js";
import { updateUserSetting } from "../utils/userUtils.js";


export default async function speak(args) {
  const speak = args[0];

  if (speak !== "on" && speak !== "off") {
    return "Usage: :speak [on|off]";
  }

  const value = speak == "on" ? "true" : "false";

  // Update local setting
  setSetting('useSpeak', value);

  // There is user logged in
  // Update remote setting
  if (getSetting("user")) {
    await updateUserSetting("useSpeak", value);
  }

  return speak == "on" ? "Switched on auto speak." : "Switched off auto speak.";
}
