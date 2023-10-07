import { getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

export default async function (req, res) {
  // Method Not Allowed if not GET
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req, res);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
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
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
