import { updateUserRole, getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { role } = req.body;
  
  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  try {
    // Check if the user exists
    const user = await getUser(username);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'User not found.',
      });
    }

    const wasSuccessful = await updateUserRole(username, role);
    if (wasSuccessful) {
      return res.status(200).json({ 
        success: true, 
        message: "Subscription updated."
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to update subscription.',
       });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error occurred while updating the user subscription.'
    });
  }
}