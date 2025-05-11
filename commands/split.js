import { updateUserSetting } from '../utils/userUtils.js';
import emitter from '../utils/eventsUtils.js';
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function fullscreen(args) {
  const usage = "Usage: :split";

  if (args.length > 0) {
    return usage;
  }

  // Configure
  if (args.length === 0) {
    // Triggle enter key text change
    emitter.emit("ui:set_enter", "⌃enter");

    setSetting('fullscreen', "split");
    emitter.emit("ui:set_fullscreen", "split");

    // Update remote setting
    if (getSetting("user")) {
      await updateUserSetting("fullscreen", "split");
    }
    return "Fullscreen split vertically.";
  }
}
