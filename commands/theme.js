export default function theme(args) {
  const theme = args[0];
  
  if (theme === "light" || theme === "dark") {
    localStorage.setItem('theme', theme);
    return null;  // this won't make the output change
  } else {
    return "Usage: :theme [light/dark]";
  }
}
