import { updateUserStatus } from "utils/sqliteUtils.js";

export default (req, res) => {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  // Update user status
  updateUserStatus(req.body.username, 'inactive');

  // Clear the auth token cookie
  res.setHeader('Set-Cookie', `auth=; HttpOnly; Path=/; Max-Age=0`);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
