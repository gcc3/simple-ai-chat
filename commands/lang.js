import { getLangCodes, getLanguageName } from "../utils/langUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function lang(args) {
  const command = args[0];
  const langCodes = getLangCodes();

  // Get lang info
  // :lang
  if (!command) {
    if (getSetting("lang")) {
      const currentLang = getSetting("lang");
      const langName = getLanguageName(currentLang);
      if (langName === "Unknown") {
        console.warn("Unknown language code: " + currentLang + ". Resetting to default.");

        setSetting("lang", "");
        return "No language set.";
      }

      return "Current language: `" + getLanguageName(currentLang) + "`, country-language code: " + currentLang;
    } else {
      return "No language set.";
    }
  }

  if (command === "ls" || command === "list") {
    // Add star to current lang
    let result = "\\" + langCodes.join(" \\") + " ";
    if (getSetting("lang")) {
      const currentLang = getSetting("lang");
      result = result.replace("\\" + currentLang + " ", "*\\" + currentLang + " ");
    }
    return result;
  }

  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :lang use [language code]";
    }

    let newLangCode = args[1].trim();
    if (newLangCode.startsWith("\"") && newLangCode.endsWith("\"")) {
      newLangCode = newLangCode.slice(1, -1);
    }

    // Try to complete the language code
    if (newLangCode.length < 5) {
      const langCodeCompletation = langCodes.filter(code => code.startsWith(newLangCode));
      if (langCodeCompletation.length === 1) {
        newLangCode = langCodeCompletation[0];
      } else if (langCodeCompletation.length > 1) {
        return "Multiple language codes found: " + langCodeCompletation.join(", ");
      }
    }

    if (langCodes.includes(newLangCode)) {
      setSetting("lang", newLangCode);
      return "Language set to `" + getLanguageName(newLangCode) + "`, country-language code: " + newLangCode + ". Please refresh to see changes.";
    } else {
      return "Language code not found.";
    }
  }

  return "Usage: :lang [ls|list]\n" +
         "       :lang use [language code]\n";
}
