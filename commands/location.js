import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function location(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    // Get geo location
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
          console.log("Location: (" + position.coords.latitude + "," + position.coords.longitude + ")");
          setSetting("location", "(" + position.coords.latitude + "," + position.coords.longitude + ")");
          resolve();
        }, reject);
      });
    } catch (e) {
      setSetting("useLocation", false);
      return "Location service failed.";
    }

    return "Location service enabled.";
  } else if (onoff === "off") {
    setSetting("location", "");
    setSetting("useLocation", false);
    return "Location service disabled.";
  } else {
    return "Usage: :location [on|off]";
  }
}
