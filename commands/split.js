import { updateUserSetting } from '../utils/userUtils.js';
import emitter from '../utils/eventsUtils.js';

export default function fullscreen(args) {
  const usage = "Usage: :split" + "\n";

  if (args.length > 0) {
    return usage;
  }

  // Configure
  if (args.length === 0) {
    // Triggle enter key text change
    emitter.emit("ui:set_enter", "⌃enter");

    localStorage.setItem('fullscreen', "split");
    emitter.emit("ui:set_fullscreen", "split");

    if (localStorage.getItem("user")) {
      updateUserSetting("fullscreen", "split");
    }
    return "Fullscreen split vertically.";
  }
}
