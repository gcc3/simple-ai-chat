export async function getVoice(voiceName) {
  const voices = await getVoices();
  for (let i = 0; i < voices.length ; i++) {
    if (voices[i].lang === localStorage.getItem("lang") && voices[i].name === voiceName) {
      return voices[i]
    }
  }
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