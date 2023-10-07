import { updateUserEmail } from 'utils/sqliteUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { username, email } = req.body;

  // Validation
  if (!username || !email) {
    return res.status(400).json({ error: 'username and email are required.' });
  }

  try {
    const wasSuccessful = await updateUserEmail(username, email);
    if (wasSuccessful) {
      return res.status(200).json({ success: true, message: "Email updated successfully" });
    } else {
      return res.status(400).json({ error: 'Failed to update Email.' });
    }
  } catch (error) {
    console.error('Error: ', error);
    return res.status(500).json({ error: 'Error occurred while updating the Email.' });
  }
}
