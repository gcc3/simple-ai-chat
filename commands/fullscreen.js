import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';

export default function fullscreen(args) {

  // If no argument is provided
  if (args.length === 0) {
    localStorage.setItem('useFullscreen', "true");
    store.dispatch(toggleFullscreen(true));
    return "Fullscreen enabled.";
  }

  // Configure
  if (args.length === 1) {
    const config = args[0];
    if (config === "off") {
      localStorage.setItem('useFullscreen', "false");
      store.dispatch(toggleFullscreen(false));
      return "Fullscreen disabled.";
    } else {
      return "Usage: :fullscreen [on|off]";
    }
  }

  if (args.length > 1) {
    return "Usage: :fullscreen [on|off]";
  }
}
