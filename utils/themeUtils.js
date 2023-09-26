
export function setTheme(theme) {
  if (theme == "light") {
    document.documentElement.style.setProperty('--background-color', 'transparent');
    document.documentElement.style.setProperty('--text-color', '#000000');
    document.documentElement.style.setProperty('--button-color', '#d3d3d3');
  }
  
  if (theme == "dark") {
    document.documentElement.style.setProperty('--background-color', '#000000');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
    document.documentElement.style.setProperty('--button-color', '#2b2b2b');
  }
}