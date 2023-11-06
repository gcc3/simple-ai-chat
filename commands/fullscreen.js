import store from '../store.js';
import { toggleFullscreen } from '../states/fullscreenSlice.js';

export default function fullscreen(args) {

  // If no argument is provided
  if (args.length === 0) {
    localStorage.setItem('fullscreen', "on");
    store.dispatch(toggleFullscreen("on"));
    return "Fullscreen enabled.";
  }

  // Configure
  if (args.length === 1) {
    const config = args[0];
    if (config === "off") {
      localStorage.setItem('fullscreen', "off");
      store.dispatch(toggleFullscreen("off"));
      return "Fullscreen disabled.";
    } else {
      return "Usage: :fullscreen [on|off]";
    }
  }

  if (args.length > 1) {
    return "Usage: :fullscreen [on|off]";
  }
}
