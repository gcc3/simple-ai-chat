
export function setTheme(theme) {
  if (theme == "light") {
    document.documentElement.style.setProperty('--background-color', 'transparent');
    document.documentElement.style.setProperty('--input-box-color', 'transparent');
    document.documentElement.style.setProperty('--output-text-color', '#000000');
  }
  
  if (theme == "dark") {
    document.documentElement.style.setProperty('--background-color', '#000000');
    document.documentElement.style.setProperty('--input-box-color', '#000000');
    document.documentElement.style.setProperty('--output-text-color', '#ffffff');
  }
}