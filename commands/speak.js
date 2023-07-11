export default function speak(args) {
  if (args[0] === "on") {
    localStorage.setItem('useAutoSpeak', "true");
    return "Switched on auto speak.";
  } else if (args[0] === "off") {
    localStorage.setItem('useAutoSpeak', "false");
    return "Switched off auto speak.";
  } else if (args[0] === "stop") {
    window.speechSynthesis.cancel();
  } else {
    return "Usage: :speak [on|off|stop]";
  }
}
