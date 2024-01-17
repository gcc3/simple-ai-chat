import { initializeSession } from "utils/sessionUtils";

export default async function clear(args) {
  initializeSession();

  sessionStorage.setItem("store", "");
  sessionStorage.setItem("node", "");
  sessionStorage.setItem("role", "");

  return "Reset.";
}
