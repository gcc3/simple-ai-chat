import { clearLocalUser } from "../utils/userUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function logout(args) {
  const username = getSetting("user");
  if (!username) {
    return "Not logged in.";
  }

  // Logout from server
  try {
    const response = await fetch("/api/user/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    // Clear user data
    clearLocalUser();

    return "Logged out.";
  } catch (error) {

    // Logout failed
    console.error(error);
    return error;
  }
}
