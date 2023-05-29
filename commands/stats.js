export default function stats(args) {
  const showhide = args[0];
  
  if (showhide === "show" || showhide === "on") {
    localStorage.setItem('useStats', "true");
    return "Show stats turned on.";
  } else if (showhide === "hide" || showhide === "off") {
    localStorage.setItem('useStats', "false");
    return "Hide stats turned off.";
  } else {
    return "Usage: :stats [show|hide]";
  }
}
