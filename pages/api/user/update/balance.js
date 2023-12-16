import { getUser, updateUserBalance } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }
  const { id, username } = authResult.user;
  
  // Get latest user info
  const user = await getUser(username);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'User not found.'
    });
  }

  // Input and validation
  const { amount } = req.body;
  if (!amount || amount < 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const wasSuccessful = await updateUserBalance(username, user.balance + amount);
    if (wasSuccessful) {
      return res.status(200).json({
        success: true,
        message: "Balance updated."
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Failed to update balance.'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error occurred while updating the balance.'
    });
  }
}
