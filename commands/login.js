import { initializeSession } from "utils/sessionUtils";
import { setUserLocalStorage } from "utils/userUtils.js";

export default async function login(args) {
  if (args.length != 2) {
    return "Usage: :login [username] [password]";
  }

  let userLoginPreviously = false;
  if (localStorage.getItem("user")) {
    userLoginPreviously = true;
  }

  const username = args[0];
  const password = args[1];

  let user = null;
  try {
    const response = await fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      user = data.user;
      setUserLocalStorage(user);
      console.log("User is set to \"" + localStorage.getItem("user") + "\".");

      if (userLoginPreviously) {
        initializeSession();
      }
      return "Login successful.";
    }
  } catch (error) {
    // Login failed
    console.error(error);
    return error;
  }
}
