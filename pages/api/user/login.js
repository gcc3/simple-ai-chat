import { getUser } from 'utils/sqliteUtils.js';
//import { session } from 'utils/session.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { user, password } = req.body;

  // Validation
  if (!user || !password) {
    return res.status(400).json({ error: 'user and password are required.' });
  }

  try {
    const user = await getUser(user);
    if (!user) {
      return res.status(401).json({ error: 'User not exists.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Create session
    const userSession = await session.createSession(user.id); // Pseudo-function to create a session

    const wasSuccessful = await updateUserSettings(user, key, value);
    if (wasSuccessful) {
      return res.status(200).json({ success: true, message: "Settings updated successfully" });
    } else {
      return res.status(400).json({ error: 'Failed to update settings or user not found.' });
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    return res.status(500).json({ error: 'An error occurred while updating the settings.' });
  }
}
