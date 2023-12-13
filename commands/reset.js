import { initializeSession } from "utils/sessionUtils";

export default async function clear(args) {
  initializeSession();
  return "Session reset.";
}
