export default function speak(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    localStorage.setItem('useAutoSpeak', "true");
    return "Switched on auto speak.";
  } else if (onoff === "off") {
    localStorage.setItem('useAutoSpeak', "false");
    return "Switched off auto speak.";
  } else {
    return "Usage: :speak [on|off]";
  }
}
