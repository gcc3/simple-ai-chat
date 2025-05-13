import { getVoice } from "../utils/voiceUtils.js"
import { getSetting, setSetting } from "../utils/settingsUtils.js";


function removeEmoji(text) {
    return text.replace(
        /([\u2700-\u27BF]|[\u1F600-\u1F64F]|[\u1F300-\u1F5FF]|[\u1F680-\u1F6FF]|[\u1F1E0-\u1F1FF]|\u24C2|\uD83C[\uDDE6-\uDDFF]|[\u2600-\u26FF]|\u23F0|\u23EF|\u23F1|\u23F2|\u25FD|\u25FE|\u25B6|\u25C0|\u231A|\u231B|\u2934|\u2935|[\uD83C\uDC04-\uDFFF]|\uD83D[\uDC00-\uDE4F])/g, 
        ''
    );
}

export async function speak(text) {
  // Remove all emojis in text
  text = text.trim();
  text = removeEmoji(text);
  
  try {
    var utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.volume = 0.7;  // 0 to 1
    utterance.rate = 1;      // 0.1 to 10
    utterance.pitch = 1.1;   // 0 to 2
    utterance.lang = getSetting("lang");
    const voice = await getVoice(getSetting("voice"));
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
