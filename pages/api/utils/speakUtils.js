
export function speak(text) {
  var utterance = new SpeechSynthesisUtterance();
  utterance.text = text;
  utterance.volume = 1;  // 0 to 1
  utterance.rate = 1;    // 0.1 to 10
  utterance.pitch = 2;   // 0 to 2
  utterance.lang = localStorage.getItem("lang");
  window.speechSynthesis.speak(utterance);
}
