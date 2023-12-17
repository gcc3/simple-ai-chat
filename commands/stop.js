const STATES = { IDLE: 0, DOING: 1 };

export default function stop(args) {
  console.log("Stopping...");
  global.STATE = STATES.IDLE;  // global is bad, but it's a quick hack
  window.speechSynthesis.cancel();
  return null;
}
