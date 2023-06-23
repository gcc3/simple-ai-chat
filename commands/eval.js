export default function evaluation(args) {
  const showhide = args[0];
  
  if (showhide === "show" || showhide === "on") {
    localStorage.setItem('useEval', "true");
    return "Show result evaluation.";
  } else if (showhide === "hide" || showhide === "off") {
    localStorage.setItem('useEval', "false");
    return "Hide result evaluation.";
  } else {
    return "Usage: :eval [on|off|show|hide]";
  }
}
