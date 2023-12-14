import { updateUserSettings, getUser, getUserRoles } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';

export default async function (req, res) {
  // Check if the method is POST.
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

  // Input and validation
  const { key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ 
      success: false,
      error: 'Username and settings are required.' 
    });
  }

  try {
    // Check if the user exists
    const user = await getUser(username);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'User not found.' 
      });
    }

    // Check if key is valid
    const validKeys = ['theme', 'speak', 'stats', "fullscreen", "role", "store"];
    if (!validKeys.includes(key)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid key, key must be one of:' + validKeys.join(', ')
      });
    }

    // Check if value is valid
    if (key === 'theme') {
      const validValues = ['light', 'dark', 'system'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of:' + validValues.join(', ')
        });
      }
    } else if (key === 'speak') {
      const validValues = ['on', 'off'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of:' + validValues.join(', ')
        });
      }
    } else if (key === 'stats') {
      const validValues = ['on', 'off'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of:' + validValues.join(', ')
        });
      }
    } else if (key === 'fullscreen') {
      const validValues = ['on', 'off'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of:' + validValues.join(', ')
        });
      }
    } else if (key === 'role') {
      const userRoles = await getUserRoles(username);
      if (Object.entries(userRoles).length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No user role found.'
        });
      }
      const validValues = Object.values(userRoles).map(r => "\"" + r.role + "\"");
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of:' + validValues.join(', ')
        });
      }
    } else if (key === 'store') {
      // TODO, check this
      const userStores = await getUserStores(username);
      if (Object.entries(userStores).length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No user role found.'
        });
      }
      const validValues = Object.values(userStores).map(s => "\"" + s.store + "\"");
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of:' + validValues.join(', ')
        });
      }
    }

    const wasSuccessful = await updateUserSettings(username, key, value);
    if (wasSuccessful) {
      return res.status(200).json({ 
        success: true, 
        message: "Settings updated successfully."
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to update settings or user not found.'
       });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error occurred while updating the user settings.'
    });
  }
}
