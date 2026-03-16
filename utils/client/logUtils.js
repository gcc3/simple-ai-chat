import { getSetting } from "../settingsUtils.js";
import { addLocalLog } from "../offlineUtils.js";

export const logadd = async (model, input, output) => {
  // Online: add log to server
  if (globalThis.isOnline) {
    const logaddResponse = await fetch("/api/log/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        output,
        model: model.name,
        session: getSetting("session"),
        images: [],
        time: Date.now(),
      }),
    });

    if (logaddResponse.status !== 200) {
      throw logaddResponse.error || new Error(`Request failed with status ${logaddResponse.status}`);
    }
  }

  // Offline: add log to local
  if (!globalThis.isOnline) {
    addLocalLog({
      input: input,
      output: output,
      model: model.name,
      session: getSetting("session"),
      images: [],
      time: Date.now(),
    });
  }
};
