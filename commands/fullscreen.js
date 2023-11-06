import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';

export default function fullscreen(args) {

  // If no argument is provided
  if (args.length === 0) {
    localStorage.setItem('fullscreen', "default");
    store.dispatch(toggleFullscreen("default"));
    return "Fullscreen enabled.";
  }

  // Configure
  if (args.length === 1) {
    const config = args[0];

    if (config === "off") {
      localStorage.setItem('fullscreen', "off");
      store.dispatch(toggleFullscreen("off"));
      return "Fullscreen disabled.";
    }

    if (config === "default") {
      localStorage.setItem('fullscreen', "default");
      store.dispatch(toggleFullscreen("default"));
      return "Fullscreen enabled.";
    }

    return "Usage: :fullscreen [default/off]";
  }

  if (args.length > 1) {
    return "Usage: :fullscreen [default/off]";
  }
}
