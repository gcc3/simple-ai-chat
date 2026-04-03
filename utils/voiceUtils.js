import { getSetting } from "../utils/settingsUtils.js";
import { getBrowserLang } from "./langUtils.js";


export async function getVoice(voiceName) {
  const currentLang = getSetting("lang") || getBrowserLang();  // by default use "en-US"

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
    voice_ = voices[0];
    console.warn("Voice `" + voiceName + "` not found in lang `" + currentLang + "` voices, use default voice: " + voice_.name);
  }

  return voice_;
}

const strangeVoiceList = [
  "Albert",
  "Bad News",
  "Whisper"
]

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
          resolve(voices.filter((voice) => voice.lang === targetLang && !strangeVoiceList.includes(voice.name)));
        }
        clearInterval(id);
      }
    }, 10);
  })
}
