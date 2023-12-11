import { decode } from "utils/authUtils"
import { getUser, updateUserEmailVerifiedAt } from "utils/sqliteUtils"
import { createToken } from "utils/authUtils"

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
    if (user.email !== data.email) {
      return res.status(400).send("Verification failed.");
    }

    // Update email verified at
    await updateUserEmailVerifiedAt(data.username);

    // Redirect and login
    // Create JWT token
    if (user) {
      // Refresh user auth token
      // Create JWT token
      const payload = { 
        id: user.id, 
        username: user.username,
        role: user.role,
        email: user.email,
      };
      const token = createToken(payload);
      if (!token) {
        return res.status(500).json({ error: 'Failed to create token.' });
      }
    }

    // Set the token as a cookie
    const sameSiteCookie = process.env.SAME_SITE_COOKIE;
    res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/; Max-Age=86400; ${sameSiteCookie}`);

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
