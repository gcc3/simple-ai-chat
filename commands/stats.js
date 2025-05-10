import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function stats(args) {
  const stats = args[0];

  if (stats !== "on" && stats !== "off") {
    return "Usage: :stats [on|off]";
  }

  const value = stats == "on" ? "true" : "false";

  // Update local setting
  setSetting('useStats', value);

  // There is user logged in
  // Update remote setting
  if (getSetting("user")) {
    try {
      const response = await fetch("/api/user/update/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "useStats",
          value: value,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  return stats == "on" ? "Show stats." : "Hide stats.";
}
