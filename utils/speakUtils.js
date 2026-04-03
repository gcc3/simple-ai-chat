import { getVoice } from "../utils/voiceUtils.js"
import { getSetting } from "../utils/settingsUtils.js";

function removeEmoji(text) {
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}

export async function speak(text) {
  // Remove all emojis in text
  text = text.trim();
  text = removeEmoji(text);
  
  console.log("Speak: " + text);
  try {
    // Speak settings
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.volume = 0.7;  // 0 to 1
    utterance.rate = 1;      // 0.1 to 10
    utterance.pitch = 1.1;   // 0 to 2

    // Speak language
    utterance.lang = getSetting("lang") || "en-US";
    
    // Speak voice
    const voice_ = getSetting("voice");
    const voice = await getVoice(voice_);
    if (voice) {
      utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Voice `" + voice_ + "` not found.");
    }
  } catch (error) {
    console.error("Failed to speak:", error);
  }
}

// Try to speak text
export function trySpeak(currentOutputText, textSpoken) {
  let textToSpeak = currentOutputText.replace(textSpoken, "");

  if (textToSpeak.length > 0) {
    const ends = [".", "?", "!", ":", ";", ",", "，", "､", "、", "・", "｡", "。", "？", "！", "：", "；"];

    if (ends.some(end => textToSpeak.includes(end))) {
      textToSpeak = textToSpeak.replaceAll("<br>", " ");

      // Speak!
      speak(textToSpeak);
      textSpoken += textToSpeak;
    }
  }

  // Update the speaken text
  return textSpoken;
}
