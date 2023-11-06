import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';
import { updateUserSetting } from 'utils/userUtils.js';

export default function fullscreen(args) {

  // If no argument is provided
  if (args.length === 0) {
    localStorage.setItem('fullscreen', "default");
    store.dispatch(toggleFullscreen("default"));
    updateUserSetting("fullscreen", "default");
    return "Fullscreen enabled.";
  }

  // Configure
  if (args.length === 1) {
    const config = args[0];

    if (config === "default") {
      localStorage.setItem('fullscreen', "default");
      store.dispatch(toggleFullscreen("default"));
      updateUserSetting("fullscreen", "default");
      return "Fullscreen enabled.";
    }

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

    return "Usage: :fullscreen" + 
           "       :fullscreen [default/split/off]"
  }

  if (args.length > 1) {
    return "Usage: :fullscreen" + 
           "       :fullscreen [default/split/off]"
  }
}

