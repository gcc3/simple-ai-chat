export default async function location(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    // Get geo location
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
          console.log("Location: (" + position.coords.latitude + "," + position.coords.longitude + ")");
          localStorage.setItem("location", "(" + position.coords.latitude + "," + position.coords.longitude + ")");
          resolve();
        }, reject);
      });
    } catch (e) {
      localStorage.setItem("useLocation", false);
      return "Location service failed.";
    }

    return "Location service enabled.";
  } else if (onoff === "off") {
    localStorage.setItem("location", "");
    localStorage.setItem("useLocation", false);
    return "Location service disabled.";
  } else {
    return "Usage: :location [on|off]";
  }
}
