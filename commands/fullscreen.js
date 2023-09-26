export default function fullscreen(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    localStorage.setItem('useFullscreen', "true");
    return "Fullscreen enabled.";
  } else if (onoff === "off") {
    localStorage.setItem('useFullscreen', "false");
    return "Fullscreen disabled.";
  } else {
    return "Usage: :fullscreen [on|off]";
  }
}
