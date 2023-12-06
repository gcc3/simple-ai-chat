import { decode } from "utils/authUtils"
import { getUser, updateUserEmail } from "utils/sqliteUtils"

export default async function (req, res) {
  // Check if the method is GET
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { token } = req.query;

  try {
    const data = decode(token);
    if (!data) {
      return res.status(400).send("Verification failed.");
    }

    // Get user
    const user = await getUser(data.username);
    if (user.id !== data.id) {
      return res.status(400).send("Verification failed.");
    }

    // Update email
    await updateUserEmail(data.username, data.email);

    // Redirect to the home page
    res.redirect(301, "/");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred during your request.",
      error
    });
  }
}
