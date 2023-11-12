import { insertUser, getUser, emailExists } from "utils/sqliteUtils.js";
import { generatePassword } from "utils/userUtils.js";

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, email, settings } = req.body;

  // Username validation
  if (!username) {
    return res.status(400).json({ error: "User name is required." });
  }
  // Check user existance
  const user = await getUser(username);
  if (user) {
    return res.status(200).json({ 
        success: false, 
        message: "Username already used." 
      });
  }

  // Email validation
  if (email) {
    // Check if the email is valid.
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email is invalid.' });
    }
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || emailParts[0].length === 0 || emailParts[1].length === 0) {
      return res.status(400).json({ error: 'Email is invalid.' });
    }
    
    // Check if the email already exists in the database.
    const emailUser = await emailExists(email);
    if (emailUser) {
      return res.status(400).json({ error: 'Email already used by user \"' + emailUser.username + '\".' });
    }
  }

  try {
    // Generate password
    const password = generatePassword();
    await insertUser(username, password, email, settings,         "", "active", new Date());
                  // username, password, email, settings, last_login,   status, created_at

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
