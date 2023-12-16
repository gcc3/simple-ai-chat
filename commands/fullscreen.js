import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';
import { toggleEnterChange } from '../states/enterSlice.js';
import { updateUserSetting } from 'utils/userUtils.js';

export default function fullscreen(args) {
  const usage = "Usage: :fullscreen" + "\n" +
                "       :fullscreen [split/off]";

  // If no argument is provided
  if (args.length === 0) {
    localStorage.setItem('fullscreen', "default");
    store.dispatch(toggleFullscreen("default"));
    updateUserSetting("fullscreen", "default");
    return "Fullscreen default enabled.";
  }

  // Configure
  if (args.length === 1) {
    const config = args[0];

    // Triggle enter key text change
    if (config === "split" && store.getState().enter === "enter")  store.dispatch(toggleEnterChange("⌃enter"));
    if (config !== "split" && store.getState().enter === "⌃enter") store.dispatch(toggleEnterChange("enter"));

    if (config === "split") {
      localStorage.setItem('fullscreen', "split");
      store.dispatch(toggleFullscreen("split"));
      updateUserSetting("fullscreen", "split");
      return "Fullscreen split vertically.";
    }

    if (config === "off") {
      localStorage.setItem('fullscreen', "off");
      store.dispatch(toggleFullscreen("off"));
      updateUserSetting("fullscreen", "off");
      return "Fullscreen disabled.";
    }

    return usage;
  }

  if (args.length > 1) {
    return usage;
  }
}

