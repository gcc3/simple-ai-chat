import { getSetting, setSetting } from "../utils/settingsUtils.js";


export async function getVoice(voiceName) {
  const voices = await getVoices();
  const currentLang = getSetting("lang");

  for (const voice of voices) {
    if (voice.lang === currentLang && voice.name === voiceName) {
      return voice;
    }
  }

  console.warn("Voice `" + voiceName + "` not found for lang `" + currentLang + "`");
  return null;
}

export function getVoices() {
  return new Promise((resolve) => {
    let id;
    id = setInterval(() => {
      if (window.speechSynthesis.getVoices().length !== 0) {
        resolve(window.speechSynthesis.getVoices());
        clearInterval(id);
      }
    }, 10);
  })
}
