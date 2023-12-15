import { softDeleteUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

// Soft delete user
export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed."
    });
  }

  // User required to delete username
  const { username } = req.body;

  // validation
  if (!username) {
    return res.status(400).json({
      success: false,
      error: "User name is required."
    });
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({
      success: false,
      error: authResult.error
    });
  }
  const { id, username: authUsername } = authResult.user;

  // Check permission
  if (authUsername !== username && authUsername !== "root") {
    return res.status(401).json({
      success: false,
      error: "Permission denied."
    });
  }

  try {
    await softDeleteUser(username);

    // If user delete himself
    // Clear the auth token cookie
    if (authUsername === username) {
      res.setHeader('Set-Cookie', `auth=; HttpOnly; Path=/; Max-Age=0`);
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}
