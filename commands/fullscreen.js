import store from '../store.js';
import { toggleFullscreen } from '../state/fullscreenSlice.js';

export default function fullscreen(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    localStorage.setItem('useFullscreen', "true");
    store.dispatch(toggleFullscreen(true));
    return "Fullscreen enabled.";
  } else if (onoff === "off") {
    localStorage.setItem('useFullscreen', "false");
    store.dispatch(toggleFullscreen(false));
    return "Fullscreen disabled.";
  } else {
    return "Usage: :fullscreen [on|off]";
  }
}
