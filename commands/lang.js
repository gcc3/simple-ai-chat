import { getLangCodes, getLanguageName } from "utils/langUtils";

export default async function lang(args) {
  const command = args[0];
  const langCodes = getLangCodes();

  if (command === "ls" || command === "list") {
    // Add star to current lang
    let result = "\\" + langCodes.join(" \\");
    if (localStorage.getItem("lang")) {
      const currentLang = localStorage.getItem("lang").replace(" force", "");
      result = result.replace("\\" + currentLang, "*\\" + currentLang);
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

    if (langCodes.includes(newLangCode)) {
      localStorage.setItem("lang", newLangCode + " force");
      return "Language set to `" + getLanguageName(newLangCode) + "`, code: " + newLangCode + ". Please refresh to see changes.";
    } else {
      return "Language code not found.";
    }
  }

  return "Usage: :lang [ls|list]\n" +
         "       :lang use [language code]\n";
}
