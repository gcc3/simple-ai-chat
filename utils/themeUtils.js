
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
    document.documentElement.style.setProperty('--placeholder-color', '#005200');
    document.documentElement.style.setProperty('--border-color', '#333333');
    document.documentElement.style.setProperty('--button-color', '#1c1c1c');
    document.documentElement.style.setProperty('--button-hover-color', '#303030');
    document.documentElement.style.setProperty('--button-text-color', '#505050');
  }
}