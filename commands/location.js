export default function location(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    // Get geo location
    navigator.geolocation.getCurrentPosition((position) => {
      console.log("Location: (" + position.coords.latitude + "," + position.coords.longitude + ")");
      localStorage.setItem('location', position.coords.latitude + "," + position.coords.longitude);
    });

    localStorage.setItem('useLocation', "true");
    return "Location service enabled.";
  } else if (onoff === "off") {
    localStorage.setItem('location', "");
    localStorage.setItem('useLocation', "false");
    return "Location service dsiabled.";
  } else {
    return "Usage: :location [on|off]";
  }
}
