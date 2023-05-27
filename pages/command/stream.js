
export default function stream(userInput) {
  const args = userInput.split(' ');
  const onoff = args[1];
  
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
