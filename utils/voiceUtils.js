export async function getVoice(voiceName) {
  const voices = await getVoices();
  const currentLang = localStorage.getItem("lang").replace(" force", "");
  
  for (let i = 0; i < voices.length ; i++) {
    if (voices[i].lang === currentLang && voices[i].name === voiceName) {
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