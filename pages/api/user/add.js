import { insertUser, getUser } from "utils/sqliteUtils.js";
import { initSettings, generatePassword } from "utils/userUtils.js";

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
          message: "User already exist." 
        });
    }
    
    // Generate password
    const password = generatePassword(8);

    // password, email, settings, last_login, status, created_at
    await insertUser(username, password, "", initSettings("json"), "", "active", new Date());  

    // No error
    return res.status(200).json({ 
        success: true,
        message: "User \"" + username + "\" is created with password \"" + password + "\"."
      });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: error.message });
  }
}
