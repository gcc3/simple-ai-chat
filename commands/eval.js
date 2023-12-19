export default async function eval_(args) {
  const value = args[0];

  if (value !== "on" && value !== "off") {
    return "Usage: :eval [on|off]";
  }

  // Update local setting
  localStorage.setItem('useEval', value == "on" ? "true" : "false");

  // There is user logged in
  // Update remote setting
  if (localStorage.getItem("user")) {
    try {
      const response = await fetch("/api/user/update/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "eval",
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
  const useEvalWill = " Note, use self evaluation score will double the cost of tokens."
  return value == "on" ? "Self evaluation score enabled." + turnOnStats + useEvalWill : "Self evaluation score disabled.";
}
