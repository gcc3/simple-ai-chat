import { updateUserSetting } from '../utils/userUtils.js';
import emitter from '../utils/eventsUtils.js';

export default function fullscreen(args) {
  const usage = "Usage: :fullscreen" + "\n" +
                "       :fullscreen [split/off]";

  // If no argument is provided
  if (args.length === 0) {
    localStorage.setItem('fullscreen', "default");
    emitter.emit("ui:set_fullscreen", "default");
    
    if (localStorage.getItem("user")) {
      updateUserSetting("fullscreen", "default");
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
      localStorage.setItem('fullscreen', "split");
      emitter.emit("ui:set_fullscreen", "split");
      
      if (localStorage.getItem("user")) {
        updateUserSetting("fullscreen", "split");
      }
      return "Fullscreen split vertically.";
    }

    if (config === "off") {
      localStorage.setItem('fullscreen', "off");
      emitter.emit("ui:set_fullscreen", "off");

      if (localStorage.getItem("user")) {
        updateUserSetting("fullscreen", "off");
      }
      return "Fullscreen disabled.";
    }

    return usage;
  }

  if (args.length > 1) {
    return usage;
  }
}

