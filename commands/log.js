import { getLocalLogs } from "../utils/offlineUtils.js";
import { getSetting } from "../utils/settingsUtils.js";

export default async function log(args) {
  if (globalThis.isOnline) {
    try {
      const response = await fetch("/api/log/list?session=" + getSetting("session"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.result.logs === "") {
        return "No log found.";
      } else {
        // Add new line for each log
        const logs = data.result.logs;
        return logs;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  } else {
    // Offline: get local logs
    const localLogs = getLocalLogs();
    if (localLogs.length === 0) {
      return "No log found.";
    } else {
      return JSON.stringify(localLogs, null, 2);
    }
  }
}
