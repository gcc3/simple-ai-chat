import { initializeSessionMemory } from "../utils/sessionUtils.js";
import { setSetting } from "../utils/settingsUtils.js";

export default async function clear(args) {
  initializeSessionMemory();

  setSetting("stores", "");
  setSetting("node", "");
  setSetting("role", "");

  return "Reset.";
}
