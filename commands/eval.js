import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function eval_(args) {
  const eval_ = args[0];

  if (eval_ !== "on" && eval_ !== "off") {
    return "Usage: :eval [on|off]";
  }

  const value = eval_ == "on" ? "true" : "false";

  // Update local setting
  setSetting('useEval', value);

  // There is user logged in
  // Update remote setting
  if (getSetting("user")) {
    try {
      const response = await fetch("/api/user/update/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "useEval",
          value: value,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  const turnOnStats = " `self_eval_score` is in stats, use command `:stats on` to show stats.";
  const useEvalWill = " Note, use self evaluation score will double the tokens."
  return eval_ == "on" ? "Self evaluation score enabled." + turnOnStats + useEvalWill : "Self evaluation score disabled.";
}
