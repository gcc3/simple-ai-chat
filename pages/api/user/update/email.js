import { updateUserEmail, emailExists } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req, res);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }
  const { id, username } = authResult.user;

  // Input and validation
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email is invalid.' });
  }

  // Check if the email already exists in the database.
  const emailUser = await emailExists(email);
  if (emailUser) {
    return res.status(400).json({ error: 'Email already used by user \"' + emailUser.username + '\".' });
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
