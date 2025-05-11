import { getSetting, setSetting, isSettingEmpty } from "../utils/settingsUtils.js";
import { updateUserSetting } from "../utils/userUtils.js";


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
  if (!isSettingEmpty("user")) {
    await updateUserSetting("useEval", value);
  }

  const turnOnStats = " `self_eval_score` is in stats, use command `:stats on` to show stats.";
  const useEvalWill = " Note, use self evaluation score will double the tokens."
  return eval_ == "on" ? "Self evaluation score enabled." + turnOnStats + useEvalWill : "Self evaluation score disabled.";
}
