import { initializeSessionMemory } from "../utils/sessionUtils.js";

export default async function clear(args) {
  initializeSessionMemory();

  sessionStorage.setItem("stores", "");
  sessionStorage.setItem("node", "");
  sessionStorage.setItem("role", "");

  return "Reset.";
}
