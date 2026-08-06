import { initializeSessionMemory } from "../utils/session.js";
import { setSetting } from "../utils/settings.js";

export default async function reset(args) {
  initializeSessionMemory();

  setSetting("stores", "");
  setSetting("node", "");
  setSetting("role", "");

  return "";
}
