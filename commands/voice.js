import { getVoice, getVoices } from "../utils/voiceUtils.js"
import { getSetting, setSetting } from "../utils/settingsUtils.js";
import { getBrowserLang } from "../utils/langUtils.js";

export default async function voice(args) {
  const command = args[0];

  if (!command) {
    const currentVoice = getSetting("voice");
    if (currentVoice) {
      const voice = await getVoice(currentVoice);
      if (voice) {
        return "Current voice: \"" + currentVoice + "\". Voice language: \"" + voice.lang + "\".";
      }
    } else {
      return "Voice not set.";
    }
  }

  if (command === "ls" || command === "list") {
    // Get current language
    const voiceLang = getSetting("lang") || getBrowserLang();
    if (!voiceLang) {
      return "Language not set.";
    }

    const voices = await getVoices(voiceLang);

    let langVoiceList = [];

    for (let i = 0; i < voices.length ; i++) {
      // Print voices
      console.log(`Voice ${i+1}: ${voices[i].name}, ${voices[i].lang}`);
      langVoiceList.push(voices[i].name);
    }

    if (langVoiceList.length === 0) {
      return "No voices found for language `" + voiceLang + "`.";
    } else {
      // Add star to current voice
      let result = "\\" + langVoiceList.join(" \\") + " ";
      if (getSetting("voice")) {
        const currentStore = getSetting("voice");
        result = result.replace("\\" + currentStore + " ", "*\\" + currentStore + " ");
      }
      return result;
    }
  }

  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :voice use [voice_name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Voice name must be quoted with double quotes.";
    }

    const voiceName = args[1].slice(1, -1);

    // find voice and set
    const voice = await getVoice(voiceName);
    if (voice) {
      setSetting("voice", voiceName);
      return "Voice is set to \"" + voiceName + "\".";
    } else {
      return "Voice not found.";
    }
  }

  if (command === "reset") {
    setSetting("voice", "");
    return "Voice has been reset.";
  }

  return "Usage: :voice [ls|list]" + "\n" +
         "       :voice use [voice_name]" + "\n" +
         "       :voice reset";
}
