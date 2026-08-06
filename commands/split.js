import { updateUserSetting } from '../utils/user.js';
import emitter from '../utils/events.js';
import { getSetting, setSetting } from "../utils/settings.js";

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
