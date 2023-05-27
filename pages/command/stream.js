
export default function stream(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    localStorage.setItem('useStream', "true");
    return "Switched to general mode.";
  } else if (onoff === "off") {
    localStorage.setItem('useStream', "false");
    return "Switched to stream mode.";
  } else {
    return "Usage: :stream [true|false]";
  }
}
