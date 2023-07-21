export function getVoice(voiceName) {
  const voices = window.speechSynthesis.getVoices();
  for (let i = 0; i < voices.length ; i++) {
    if (voices[i].lang === localStorage.getItem("lang") && voices[i].name === voiceName) {
      return voices[i]
    }
  }
  return null;
}
