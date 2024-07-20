import { updateUserPassword } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

export default async function (req, res) {
  // Check method.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }
  const { id, username } = authResult.user;
  
  // Input and validation
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password are required.' });
  }

  try {
    const wasSuccessful = await updateUserPassword(username, password);
    if (wasSuccessful) {
      return res.status(200).json({ success: true, message: "Password updated." });
    } else {
      return res.status(400).json({ error: 'Failed to update password.' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error occurred while updating the password.' });
  }
}
