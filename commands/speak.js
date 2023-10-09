export default async function speak(args) {
  const value = args[0];

  if (value !== "on" && value !== "off") {
    return "Usage: :speak [on|off]";
  }

  // Update local setting
  localStorage.setItem('useSpeak', value == "on" ? "true" : "false");

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
          key: "speak",
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

  return value == "on" ? "Switched on auto speak." : "Switched off auto speak.";
}
