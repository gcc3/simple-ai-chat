export default function stream(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    localStorage.setItem('useStream', true);
    return "Switched to stream mode.";
  } else if (onoff === "off") {
    localStorage.setItem('useStream', false);
    return "Switched to non-stream mode; will display after all texts are received.";
  } else {
    return "Usage: :stream [on|off]";
  }
}
