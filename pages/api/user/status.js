import { getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

// Modified from info.js
export default async function (req, res) {
  // Method Not Allowed if not GET
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req, res);
  if (!authResult.success) {
    return res.status(200).json({ user: null });
  }
  const { id, username } = authResult.user;

  try {
    const user = await getUser(username);
    if (user) {
      res.status(200).json({ 
        user: {
          id: user.id, 
          username: user.username,
          email: user.email,
          settings: user.settings
        }
      });
    } else {
      // Clear the auth token cookie
      res.setHeader('Set-Cookie', `auth=; HttpOnly; Path=/; Max-Age=0`);

      // Return user is removed when user not exist
      res.status(404).json({ error: 'User has been removed.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
