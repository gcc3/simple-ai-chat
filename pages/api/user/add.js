import { insertUser, getUser } from "utils/sqliteUtils.js";
import { generatePassword } from "utils/userUtils.js";

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // User required username
  const { username } = req.body;

  // validation
  if (!username) {
    return res.status(400).json({ error: "User name is required." });
  }

  try {
    // Check user existance
    const user = await getUser(username);
    if (user) {
      return res.status(200).json({ 
          success: false, 
          message: "Username already used." 
        });
    }
    
    // Generate password
    const password = generatePassword();

    // password, email, settings, last_login, status, created_at
    await insertUser(username, password, "", "", "", "active", new Date());
    await updateUserSettings(username, "role", localStorage.getItem("role") || "");
    await updateUserSettings(username, "theme", localStorage.getItem("theme") || "light");
    await updateUserSettings(username, "speak", localStorage.getItem("speak") || "off");
    await updateUserSettings(username, "stats", localStorage.getItem("stats") || "on");

    // No error
    return res.status(200).json({ 
        success: true,
        username: username,
        password: password,
        message: "User \"" + username + "\" is created with password \"" + password + "\".",
      });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: error.message });
  }
}
