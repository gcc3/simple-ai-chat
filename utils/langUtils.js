export function getLanguages() {
  const languages = [
    { "language_code": "ar-EG", "name": "Arabic (Egypt)", "native_name": "العربية (مصر)" },
    { "language_code": "ar-IQ", "name": "Arabic (Iraq)", "native_name": "العربية (العراق)" },
    { "language_code": "ar-MA", "name": "Arabic (Morocco)", "native_name": "العربية (المغرب)" },
    { "language_code": "ar-SA", "name": "Arabic (Saudi Arabia)", "native_name": "العربية (السعودية)" },
    { "language_code": "ar-SY", "name": "Arabic (Syria)", "native_name": "العربية (سوريا)" },
    { "language_code": "bn-BD", "name": "Bengali", "native_name": "বাংলা" },
    { "language_code": "de-DE", "name": "German", "native_name": "Deutsch" },
    { "language_code": "en-US", "name": "English (US)", "native_name": "English (US)" },
    { "language_code": "en-GB", "name": "English (UK)", "native_name": "English (UK)" },
    { "language_code": "es-ES", "name": "Spanish", "native_name": "Español" },
    { "language_code": "fr-CA", "name": "French (Canada)", "native_name": "Français (Canada)" },
    { "language_code": "fr-FR", "name": "French (France)", "native_name": "Français (France)" },
    { "language_code": "hi-IN", "name": "Hindi (India)", "native_name": "हिन्दी" },
    { "language_code": "id-ID", "name": "Indonesian (Indonesia)", "native_name": "Bahasa Indonesia" },
    { "language_code": "it-IT", "name": "Italian (Italy)", "native_name": "Italiano" },
    { "language_code": "ja-JP", "name": "Japanese", "native_name": "日本語" },
    { "language_code": "ko-KR", "name": "Korean", "native_name": "한국어" },
    { "language_code": "nl-BE", "name": "Dutch (Belgium)", "native_name": "Nederlands (België)" },
    { "language_code": "nl-NL", "name": "Dutch (Netherlands)", "native_name": "Nederlands" },
    { "language_code": "pl-PL", "name": "Polish", "native_name": "Polski" },
    { "language_code": "pt-BR", "name": "Portuguese (Brazil)", "native_name": "Português (Brasil)" },
    { "language_code": "pt-PT", "name": "Portuguese (Portugal)", "native_name": "Português (Portugal)" },
    { "language_code": "ru-RU", "name": "Russian", "native_name": "Русский" },
    { "language_code": "sv-FI", "name": "Swedish (Finland)", "native_name": "Svenska (Finland)" },
    { "language_code": "sv-SE", "name": "Swedish (Sweden)", "native_name": "Svenska (Sverige)" },
    { "language_code": "tr-TR", "name": "Turkish (Turkey)", "native_name": "Türkçe" },
    { "language_code": "zh-CN", "name": "Chinese (S)", "native_name": "中文(简体)" },
    { "language_code": "zh-HK", "name": "Chinese (Hong Kong)", "native_name": "中文(香港)" },
    { "language_code": "zh-TW", "name": "Chinese (T)", "native_name": "中文(繁體)" },
  ];
  return languages;
}

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
    "tr-TR",  // Turkish (Turkey)
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
  if (code === "tr-TR") return "Turkish (Turkey)";
  if (code === "zh-CN") return "Chinese (S)";
  if (code === "zh-HK") return "Chinese (Hong Kong)";
  if (code === "zh-TW") return "Chinese (T)";
  return "Unknown";
}
