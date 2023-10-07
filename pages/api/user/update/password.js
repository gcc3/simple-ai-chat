import { updateUserPassword } from 'utils/sqliteUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Authentication
  const token = req.cookies.auth;
  if (!token) return { success: false, error: 'Token not provided' };
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const { id, username } = decoded;
  
  // Input and validation
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'password are required.' });
  }

  try {
    const wasSuccessful = await updateUserPassword(username, password);
    if (wasSuccessful) {
      return res.status(200).json({ success: true, message: "Password updated successfully" });
    } else {
      return res.status(400).json({ error: 'Failed to update password.' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error occurred while updating the password.' });
  }
}
