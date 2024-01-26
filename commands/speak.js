export default async function speak(args) {
  const speak = args[0];

  if (speak !== "on" && speak !== "off") {
    return "Usage: :speak [on|off]";
  }

  const value = speak == "on" ? "true" : "false";

  // Update local setting
  localStorage.setItem('useSpeak', value);

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
          key: "useSpeak",
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

  return speak == "on" ? "Switched on auto speak." : "Switched off auto speak.";
}
