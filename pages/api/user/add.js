import { insertUser } from "utils/sqliteUtils.js";

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name } = req.body;

  // validation
  if (!name) {
    return res.status(400).json({ error: "User name is required." });
  }

  try {
    const password = generateRandomString(8);
    await insertUser(name, password, "", ""); // password, settings, last_login
    return res.status(200).json({ success: true, password: password });
  } catch (error) {
    console.error("Error inserting user:", error);
    return res.status(500).json({ error: "An error occurred while adding the user." });
  }
}

function generateRandomString(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
