import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default function stream(args) {
  const onoff = args[0];
  
  if (onoff === "on") {
    setSetting('useStream', true);
    return "Switched to stream mode.";
  } else if (onoff === "off") {
    setSetting('useStream', false);
    return "Switched to non-stream mode; will display after all texts are received.";
  } else {
    return "Usage: :stream [on|off]";
  }
}
