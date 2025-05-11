import { updateUserSettings, getUser } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { getSettings } from 'utils/settingsUtils.js';
import { generatePassword } from 'utils/userUtils';

export default async function (req, res) {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Get user
  const user = await getUser(username);
  if (!user) {
    return res.status(400).json({ 
      success: false, 
      error: 'User not found.' 
    });
  }

  try {
    // Update user settings
    let userDefaultSettings = getSettings("user_default");
    userDefaultSettings.groupPassword = generatePassword();

    const wasSuccessful = await updateUserSettings(username, JSON.stringify(userDefaultSettings));
    if (wasSuccessful) {
      return res.status(200).json({ 
        success: true, 
        message: "Settings reset."
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to reset settings.'
       });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error occurred while resetting the user settings.'
    });
  }
}
