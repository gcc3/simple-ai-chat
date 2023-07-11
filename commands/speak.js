export default function speak(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    localStorage.setItem('useAutoSpeak', "true");
    return "Switched to auto speak.";
  } else if (onoff === "off") {
    localStorage.setItem('useAutoSpeak', "false");
    return "Switched to not auto speak.";
  } else {
    return "Usage: :speak [on|off]";
  }
}
