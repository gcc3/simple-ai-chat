import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';
import { toggleEnterChange } from '../states/enterSlice.js';
import { updateUserSetting } from '../utils/userUtils.js';

export default function fullscreen(args) {
  const usage = "Usage: :split" + "\n";

  if (args.length > 0) {
    return usage;
  }

  // Configure
  if (args.length === 0) {
    // Triggle enter key text change
    if (store.getState().enter === "enter")  store.dispatch(toggleEnterChange("⌃enter"));

    localStorage.setItem('fullscreen', "split");
    store.dispatch(toggleFullscreen("split"));
    if (localStorage.getItem("user")) {
      updateUserSetting("fullscreen", "split");
    }
    return "Fullscreen split vertically.";
  }
}
