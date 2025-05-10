import { getSetting, setSetting } from "../utils/settingsUtils.js";


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
    try {
      const response = await fetch("/api/user/update/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "theme",
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

  return;
}
