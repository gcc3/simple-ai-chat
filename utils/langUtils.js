export function getLangCodes() {
  const langCodes = [
    "ar-EG",  // Arabic (Egypt)
    "ar-IQ",  // Arabic (Iraq)
    "ar-MA",  // Arabic (Morocco)
    "ar-SA",  // Arabic (Saudi Arabia)
    "ar-SY",  // Arabic (Syria)
    "bn-BD",  // Bengali
    "de-DE",  // German
    "en-US",  // English (US)
    "en-GB",  // English (UK)
    "es-ES",  // Spanish
    "fr-CA",  // French (Canada)
    "fr-FR",  // French (France)
    "hi-IN",  // Hindi (India)
    "id-ID",  // Indonesian (Indonesia)
    "it-IT",  // Italian (Italy)
    "ja-JP",  // Japanese
    "ko-KR",  // Korean
    "nl-BE",  // Dutch (Belgium)
    "nl-NL",  // Dutch (Netherlands)
    "pl-PL",  // Polish
    "pt-BR",  // Portuguese (Brazil)
    "pt-PT",  // Portuguese (Portugal)
    "ru-RU",  // Russian
    "sv-FI",  // Swedish (Finland)
    "sv-SE",  // Swedish (Sweden)
    "zh-CN",  // Chinese (S)
    "zh-HK",  // Chinese (Hong Kong)
    "zh-TW",  // Chinese (T)
  ];
  return langCodes;
}

export function getLanguageName(code) {
  if (code === "ar-EG") return "Arabic (Egypt)";
  if (code === "ar-IQ") return "Arabic (Iraq)";
  if (code === "ar-MA") return "Arabic (Morocco)";
  if (code === "ar-SA") return "Arabic (Saudi Arabia)";
  if (code === "ar-SY") return "Arabic (Syria)";
  if (code === "bn-BD") return "Bengali";
  if (code === "de-DE") return "German";
  if (code === "en-US") return "English (US)";
  if (code === "en-GB") return "English (UK)";
  if (code === "es-ES") return "Spanish";
  if (code === "fr-CA") return "French (Canada)";
  if (code === "fr-FR") return "French (France)";
  if (code === "hi-IN") return "Hindi (India)";
  if (code === "id-ID") return "Indonesian (Indonesia)";
  if (code === "it-IT") return "Italian (Italy)";
  if (code === "ja-JP") return "Japanese";
  if (code === "ko-KR") return "Korean";
  if (code === "nl-BE") return "Dutch (Belgium)";
  if (code === "nl-NL") return "Dutch (Netherlands)";
  if (code === "pl-PL") return "Polish";
  if (code === "pt-BR") return "Portuguese (Brazil)";
  if (code === "pt-PT") return "Portuguese (Portugal)";
  if (code === "ru-RU") return "Russian";
  if (code === "sv-FI") return "Swedish (Finland)";
  if (code === "sv-SE") return "Swedish (Sweden)";
  if (code === "zh-CN") return "Chinese (S)";
  if (code === "zh-HK") return "Chinese (Hong Kong)";
  if (code === "zh-TW") return "Chinese (T)";
  return "Unknown";
}