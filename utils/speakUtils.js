import { getVoice } from "../utils/voiceUtils.js"

export async function speak(text) {
  try {
    var utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.volume = 0.7;  // 0 to 1
    utterance.rate = 1;      // 0.1 to 10
    utterance.pitch = 1.1;   // 0 to 2
    utterance.lang = localStorage.getItem("lang");
    const voice = await getVoice(localStorage.getItem("voice"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Failed to speak:", error);
  }
}

export function trySpeak(currentText, textSpoken) {
  const text = currentText.replace(textSpoken, "");
  if (text.length > 0) {
    const ends = [".", "?", "!", ":", ";", ",", "，", "､", "、", "・", "｡", "。", "？", "！", "：", "；"];
    if (ends.some(end => text.includes(end))) {
      speak(text.replaceAll("<br>", " "));
      textSpoken += text;
    }
  }
  return textSpoken;
}
