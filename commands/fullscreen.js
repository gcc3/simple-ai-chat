import { updateUserSetting } from '../utils/userUtils.js';
import emitter from '../utils/eventsUtils.js';
import { getSetting, setSetting } from "../utils/settingsUtils.js";
import { FULLSCREEN } from "../constants.js";

export default function fullscreen(args) {
  const usage = "Usage: :fullscreen" + "\n" +
                "       :fullscreen [split/off]";

  // If no argument is provided
  if (args.length === 0) {
    setSetting('fullscreen', FULLSCREEN.Default);
    emitter.emit("ui:set_fullscreen", FULLSCREEN.Default);
    
    if (getSetting("user")) {
      updateUserSetting("fullscreen", FULLSCREEN.Default);
    }
    return "Fullscreen default enabled.";
  }

  // Configure
  if (args.length === 1) {
    const config = args[0];

    // Triggle enter key text change
    if (config === "split") {
      emitter.emit("ui:set_enter", "⌃enter");
    }
    if (config !== "split") {
      emitter.emit("ui:set_enter", "enter");
    }

    if (config === "split") {
      setSetting('fullscreen', FULLSCREEN.Split);
      emitter.emit("ui:set_fullscreen", FULLSCREEN.Split);
      
      if (getSetting("user")) {
        updateUserSetting("fullscreen", FULLSCREEN.Split);
      }
      return "Fullscreen split vertically.";
    }

    if (config === "off") {
      setSetting('fullscreen', FULLSCREEN.Off);
      emitter.emit("ui:set_fullscreen", FULLSCREEN.Off);

      if (getSetting("user")) {
        updateUserSetting("fullscreen", FULLSCREEN.Off);
      }
      return "Fullscreen disabled.";
    }

    return usage;
  }

  if (args.length > 1) {
    return usage;
  }
}

