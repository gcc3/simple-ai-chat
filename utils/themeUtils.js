import { enableCSSRulesBySelector, disableCSSRulesBySelector } from './cssUtils.js';

export function setTheme(theme) {
  if (theme == "light") {
    document.documentElement.style.setProperty("--background-color", "transparent");
    document.documentElement.style.setProperty("--text-color", "#000000");
    document.documentElement.style.setProperty("--placeholder-color", "#8e8ea0");
    document.documentElement.style.setProperty("--button-color", "#d3d3d3");
    document.documentElement.style.setProperty("--button-hover-color", "#828282");
    document.documentElement.style.setProperty("--button-text-color", "#fff");
    document.documentElement.style.setProperty("--stats-text-color", "#767676");
    document.documentElement.style.setProperty("--info-text-color", "#cccccc");
    document.documentElement.style.setProperty("--border-color", "#ccc");
    document.documentElement.style.setProperty("--border-shadow-color", "rgba(139, 139, 139, 0.4)");
    document.documentElement.style.setProperty("--code-block-background-color", "#f6f6f6");
    document.documentElement.style.setProperty("--code-block-text-color", "#000000");
    document.documentElement.style.setProperty("--inline-code-background-color", "#f6f6f6");
    document.documentElement.style.setProperty("--inline-code-text-color", "#e01e5a");
    document.documentElement.style.setProperty("--dot-color", "#8e8ea0");
    document.documentElement.style.setProperty("--dot-hover-color", "#000000");
    document.documentElement.style.setProperty("--sub-text-color", "#767676");
    document.documentElement.style.setProperty("--nav-background-color", "rgba(235, 235, 235, 0.4)");
    document.documentElement.style.setProperty("--nav-hover-background-color", "rgba(215, 215, 215, 0.4)");
    document.documentElement.style.setProperty("--content-background-color", "rgba(235, 235, 235, 0.4)");
    document.documentElement.style.setProperty("--strong-text-background-color", "rgba(255, 255, 51, 0.4)");
    document.documentElement.style.setProperty("--underline-text-background-color", "transparent");
    document.documentElement.style.setProperty("--underline-text-color", "#0645AD");
    document.documentElement.style.setProperty("--table-border-color", "#AEAEAE");
  }

  if (theme == "dark") {
    document.documentElement.style.setProperty("--background-color", "#111111");
    document.documentElement.style.setProperty("--text-color", "#c7c7c7");
    document.documentElement.style.setProperty("--placeholder-color", "#5c5c5c");
    document.documentElement.style.setProperty("--button-color", "#333333");
    document.documentElement.style.setProperty("--button-hover-color", "#444444");
    document.documentElement.style.setProperty("--button-text-color", "#A9A9A9");
    document.documentElement.style.setProperty("--stats-text-color", "#9a9a9a");
    document.documentElement.style.setProperty("--info-text-color", "#a1a1a1");
    document.documentElement.style.setProperty("--border-color", "#2c2c2c");
    document.documentElement.style.setProperty("--border-shadow-color", "rgba(50, 50, 50, 0.4)");
    document.documentElement.style.setProperty("--code-block-background-color", "#212121");
    document.documentElement.style.setProperty("--code-block-text-color", "#c7c7c7");
    document.documentElement.style.setProperty("--inline-code-background-color", "#212121");
    document.documentElement.style.setProperty("--inline-code-text-color", "#bd93f9");
    document.documentElement.style.setProperty("--dot-color", "#5c5c5c");
    document.documentElement.style.setProperty("--dot-hover-color", "#c7c7c7");
    document.documentElement.style.setProperty("--sub-text-color", "#9a9a9a");
    document.documentElement.style.setProperty("--nav-background-color", "rgba(45, 45, 45, 0.4)");
    document.documentElement.style.setProperty("--nav-hover-background-color", "rgba(65, 65, 65, 0.4)");
    document.documentElement.style.setProperty("--content-background-color", "rgba(45, 45, 45, 0.4)");
    document.documentElement.style.setProperty("--strong-text-background-color", "rgba(99, 99, 99, 0.4)");
    document.documentElement.style.setProperty("--underline-text-background-color", "transparent");
    document.documentElement.style.setProperty("--underline-text-color", "#9a9a9a");
    document.documentElement.style.setProperty("--table-border-color", "#9a9a9a");
  }

  if (theme == "terminal") {
    document.documentElement.style.setProperty("--background-color", "#000000");
    document.documentElement.style.setProperty("--text-color", "#00f700");
    document.documentElement.style.setProperty("--placeholder-color", "#007000");
    document.documentElement.style.setProperty("--button-color", "#001400");
    document.documentElement.style.setProperty("--button-hover-color", "#001f00");
    document.documentElement.style.setProperty("--button-text-color", "#007000");
    document.documentElement.style.setProperty("--stats-text-color", "#007000");
    document.documentElement.style.setProperty("--info-text-color", "#007000");
    document.documentElement.style.setProperty("--border-color", "rgba(0, 112, 0, 0.4)");
    document.documentElement.style.setProperty("--border-shadow-color", "rgba(0, 112, 0, 0.6)");
    document.documentElement.style.setProperty("--code-block-background-color", "#001f00");
    document.documentElement.style.setProperty("--code-block-text-color", "#00f700");
    document.documentElement.style.setProperty("--inline-code-background-color", "#001f00");
    document.documentElement.style.setProperty("--inline-code-text-color", "#00f700");
    document.documentElement.style.setProperty("--dot-color", "#007000");
    document.documentElement.style.setProperty("--dot-hover-color", "#00f700");
    document.documentElement.style.setProperty("--sub-text-color", "#007000");
    document.documentElement.style.setProperty("--nav-background-color", "rgba(0, 70, 0, 0.3)");
    document.documentElement.style.setProperty("--nav-hover-background-color", "rgba(0, 100, 0, 0.3)");
    document.documentElement.style.setProperty("--content-background-color", "rgba(0, 70, 0, 0.3)");
    document.documentElement.style.setProperty("--strong-text-background-color", "rgba(0, 112, 0, 0.5)");
    document.documentElement.style.setProperty("--underline-text-background-color", "transparent");
    document.documentElement.style.setProperty("--underline-text-color", "#00f700");
    document.documentElement.style.setProperty("--table-border-color", "#007000");
  }

  // Code highlighting styles
  if (theme == "light") {
    require('highlight.js/styles/github.css');
    enableCSSRulesBySelector('.hljs');
  }

  if (theme == "dark") {
    require('highlight.js/styles/github-dark.css');
    enableCSSRulesBySelector('.hljs');
  }
  
  if (theme == "terminal") {
    disableCSSRulesBySelector('.hljs');
  }
}
