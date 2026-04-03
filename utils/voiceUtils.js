import { getSetting } from "../utils/settingsUtils.js";


export async function getVoice(voiceName) {
  const currentLang = getSetting("lang") || "en-US";  // by default use "en-US"
  
  const voices = await getVoices(currentLang);

  if (!voices || voices.length === 0) {
    console.warn("No voices found for lang `" + currentLang + "`.");
    return null;
  }

  let voice_ = null;
  for (const voice of voices) {
    if (voice.lang === currentLang && voice.name === voiceName) {
      voice_ = voice;
    }
  }

  if (!voice_) {
    console.warn("Voice `" + voiceName + "` not found for lang `" + currentLang + "`" + ", use default voice.");
    voice_ = voices[0];
  }

  return voice_;
}

export function getVoices(lang = "") {
  return new Promise((resolve) => {
    let id;
    id = setInterval(() => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length !== 0) {
        const targetLang = (lang || "").trim();
        if (!targetLang) {
          resolve(voices);
        } else {
          resolve(voices.filter((voice) => voice.lang === targetLang));
        }
        clearInterval(id);
      }
    }, 10);
  })
}
