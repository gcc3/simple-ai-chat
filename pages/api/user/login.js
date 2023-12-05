import { getUser, updateUserLastLogin, updateUserStatus } from "utils/sqliteUtils.js";
import { createToken } from "utils/authUtils.js";

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
  const user = await getUser(username);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  // Check password
  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

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

  // Update user status
  await updateUserStatus(user.username, 'active');

  // Update user last login
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const browser = req.headers['user-agent'];
  await updateUserLastLogin(user.username, "T=" + (new Date()) + " IP=" + ip + " BSR=" + browser);

  // Set the token as a cookie
  const sameSiteCookie = process.env.SAME_SITE_COOKIE;
  res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/; Max-Age=86400; ${sameSiteCookie}`);
  res.status(200).json({ 
    success: true, 
    user: { 
      username: user.username, 
      role: user.role,
      email: user.email, 
      settings: user.settings } 
  });
};
