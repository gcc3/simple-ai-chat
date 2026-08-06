import { getSetting } from "../utils/settings.js";
import { getBrowserLang } from "./lang.js";

const VOICE_FALLBACK = {
  "en-US": ["Google US English", "Samantha"],
  "en-GB": ["Google UK English Female", "Google UK English Male", "Daniel"],
  "zh-CN": ["Google 普通话（中国大陆）", "Tingting"],
  "zh-TW": ["Google 國語（臺灣）", "Meijia"],
  "zh-HK": ["Google 粤語（香港）", "Sinji"],
  "ja-JP": ["Google 日本語", "Kyoko"],
};

export function getFallbackVoiceNames(lang) {
  return VOICE_FALLBACK[lang] || null;
}

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
      break;
    }
  }

  // Find suggested voice
  if (!voice_) {
    const fallbackVoiceNames = getFallbackVoiceNames(currentLang);
    if (fallbackVoiceNames) {
      for (const fallbackName of fallbackVoiceNames) {
        for (const voice of voices) {
          if (voice.lang === currentLang && voice.name === fallbackName) {
            voice_ = voice;
            break;
          }
        }
        if (voice_) break;
      }
    }
  }

  // Use the first voice as fallback
  if (!voice_) {
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
