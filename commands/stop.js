export default function stop(args) {
  window.speechSynthesis.cancel();
  return null;
}
