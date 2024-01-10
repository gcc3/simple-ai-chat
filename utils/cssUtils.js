let originalStyles = {}; // Object to store original styles

export function disableCSSRulesBySelector(selector) {
  for (let sheet of document.styleSheets) {
    try {
      var rules = sheet.cssRules || sheet.rules;
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i];
        if (rule.type === CSSRule.STYLE_RULE && rule.selectorText.includes(selector)) {
          // Store the original CSS text
          originalStyles[rule.selectorText] = rule.style.cssText;

          // Disable the rule
          rule.style.cssText = "";
        }
      }
    } catch (e) {
      console.error("Cannot read the stylesheet rules", e);
    }
  }
}

export function enableCSSRulesBySelector(selector) {
  for (let sheet of document.styleSheets) {
    try {
      var rules = sheet.cssRules || sheet.rules;
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i];
        if (rule.type === CSSRule.STYLE_RULE && rule.selectorText.includes(selector)) {
          // Restore the original CSS text if it was stored
          if (originalStyles[rule.selectorText]) {
            rule.style.cssText = originalStyles[rule.selectorText];
          }
        }
      }
    } catch (e) {
      console.error("Cannot read the stylesheet rules", e);
    }
  }
}

export function setHighlightjsTheme(themeUrl) {
  // Check if the link element for the theme already exists
  let themeLink = document.getElementById("highlightjs-theme");

  if (themeLink) {
    // If it exists, just change the href to switch themes
    themeLink.href = themeUrl;
  } else {
    // If it does not exist, create a new link element for the theme
    themeLink = document.createElement("link");
    themeLink.id = "highlightjs-theme";
    themeLink.rel = "stylesheet";
    themeLink.type = "text/css";
    themeLink.href = themeUrl;

    // Append the new link element to the head of the document
    document.head.appendChild(themeLink);
  }
}

export function unsetHighlightjsTheme() {
  // Check if the link element for the theme exists
  let themeLink = document.getElementById("highlightjs-theme");

  if (themeLink) {
    // If it exists, remove it
    themeLink.remove();
  }
}