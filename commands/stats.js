import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function stats(args) {
  const stats = args[0];

  if (stats !== "on" && stats !== "off") {
    return "Usage: :stats [on|off]";
  }

  const value = stats == "on" ? "true" : "false";

  // Update local setting
  setSetting('useStats', value);

  return stats == "on" ? "Show stats." : "Hide stats.";
}
