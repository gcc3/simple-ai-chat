import { decode } from "utils/authUtils"
import { getUser, updateUserEmail } from "utils/sqliteUtils"

export default async function (req, res) {
  // Check if the method is GET
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { token } = req.query;

  try {
    data = decode(token);
    if (!data) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification failed.',
      });
    }

    // Get user
    const user = await getUser(data.username);
    if (user.id !== data.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification failed.',
      });
    }

    // Update email
    await updateUserEmail(data.username, data.email);

    // Output the result
    res.status(200).json({
      result: {
        success: true,
        message: "Email verified and updated."
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred during your request.",
      error
    });
  }
}
