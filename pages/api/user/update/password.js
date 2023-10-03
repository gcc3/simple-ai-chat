import { updateUserPassword } from 'utils/sqliteUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { user, password } = req.body;

  // Basic validation
  if (!user || !password) {
    return res.status(400).json({ error: 'user and password are required.' });
  }

  try {
    const wasSuccessful = await updateUserPassword(user, password);
    if (wasSuccessful) {
      return res.status(200).json({ success: true, message: "Password updated successfully" });
    } else {
      return res.status(400).json({ error: 'Failed to update password or user not found.' });
    }
  } catch (error) {
    console.error('Error updating user password:', error);
    return res.status(500).json({ error: 'An error occurred while updating the password.' });
  }
}
