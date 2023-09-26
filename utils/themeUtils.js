
export function setTheme(theme) {
  if (theme == "light") {
    document.documentElement.style.setProperty('--background-color', 'transparent');
    document.documentElement.style.setProperty('--text-color', '#000000');
    document.documentElement.style.setProperty('--placeholder-color', '#8e8ea0');
    document.documentElement.style.setProperty('--border-color', '#ccc');
    document.documentElement.style.setProperty('--button-color', '#d3d3d3');
    document.documentElement.style.setProperty('--button-hover-color', '#828282');
    document.documentElement.style.setProperty('--button-text-color', '#fff');
  }
  
  if (theme == "dark") {
    document.documentElement.style.setProperty('--background-color', '#000000');
    document.documentElement.style.setProperty('--text-color', '#00f700');
    document.documentElement.style.setProperty('--placeholder-color', '#027a02');
    document.documentElement.style.setProperty('--border-color', '#333333');
    document.documentElement.style.setProperty('--button-color', '#2b2b2b');
    document.documentElement.style.setProperty('--button-hover-color', '#3d3d3d');
    document.documentElement.style.setProperty('--button-text-color', '#7f7f7f');
  }
}