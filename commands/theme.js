export default function theme(args) {
  const theme = args[0];
  
  if (theme === "light" || theme === "dark") {
    localStorage.setItem('theme', theme);
    return "Changed to " + theme + " theme.";
  } else {
    return "Usage: :theme [light/dark]";
  }
}
