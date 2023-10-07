import { getUser, updateUserStatus } from "utils/sqliteUtils.js";
import jwt from 'jsonwebtoken';

export default async (req, res) => {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();  // Method Not Allowed
  }

  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Get user
  const user = getUser(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create JWT token
  const payload = { id: user.id, username: user.username };
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });

  // Update user status
  updateUserStatus(user.username, 'active');

  // Set the token as a cookie
  res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/; Max-Age=86400`);
  res.status(200).json({ success: true });
};
