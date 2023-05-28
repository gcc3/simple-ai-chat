export default function stats(args) {
  const showhide = args[0];
  
  if (showhide === "show") {
    localStorage.setItem('useStats', "true");
    return "Show stats info.";
  } else if (showhide === "hide") {
    localStorage.setItem('useStats', "false");
    return "Hide stats info.";
  } else {
    return "Usage: :stats [show|hide]";
  }
}
