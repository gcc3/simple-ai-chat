import { updateUserSettings } from 'utils/sqliteUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { user, key, value } = req.body;

  // Basic validation
  if (!user || !key || !value) {
    return res.status(400).json({ error: 'user and settings are required.' });
  }

  try {
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
