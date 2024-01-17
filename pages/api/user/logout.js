import { updateUserStatus, getUser } from "utils/sqliteUtils.js";

export default async (req, res) =>  {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { username } = req.body;

  // Get user
  const user = await getUser(username);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User not found.'
    });
  }

  if (user.status !== 'suspend') {
     // Update user status
    updateUserStatus(user.username, 'inactive');
  }

  // Clear the auth token cookie
  res.setHeader('Set-Cookie', `auth=; HttpOnly; Path=/; Max-Age=0`);
  res.status(200).json({ success: true, message: 'Logged out' });
};
