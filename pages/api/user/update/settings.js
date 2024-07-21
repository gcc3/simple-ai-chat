import { updateUserSettings, getUser, getUserRoles } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { getAvailableStoresForUser } from 'utils/storeUtils';
import { getAvailableNodesForUser } from 'utils/nodeUtils';
import { getSystemRoles } from 'utils/roleUtils';
import { getSettings } from 'utils/settingsUtils';
import { getLangCodes } from 'utils/langUtils';

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

  // Input and validation
  // value is allowed to be empty string
  const { key, value } = req.body;
  if (!key || value == null) {
    return res.status(400).json({ 
      success: false,
      error: '`key` and `value` are required.' 
    });
  }

  try {
    // I. Check if key is valid
    let validKeys = [];
    const availableSettings = getSettings();
    for (const [key, value] of Object.entries(availableSettings)) {
      validKeys.push(key);
    }

    if (!validKeys.includes(key)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid key, key must be one of:' + validKeys.join(', ')
      });
    }

    // II. Check if value is valid
    if (key === 'theme') {
      const validValues = ['light', 'dark', 'terminal'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    }

    if (key === 'lang') {
      const validValues = getLangCodes();
      const value_ = value.replace("force", "").trim();
      if (!validValues.includes(value_)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    }
    
    if (key === 'useSpeak') {
      const validValues = ['true', 'false'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } 
    
    if (key === 'useStats') {
      const validValues = ['true', 'false'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } 
    
    if (key === 'fullscreen') {
      const validValues = ['default', 'split', 'off'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } 
    
    if (key === 'role') {
      const userRoles = await getUserRoles(username);
      const systemRoles = await getSystemRoles();

      if (Object.entries(userRoles).length === 0 && systemRoles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No role found.'
        });
      }

      let validValues = [];

      // Add empty role
      validValues.push("\"\"");

      // Add user roles
      Object.values(userRoles).map(s => {
        const value = "\"" + s.role + "\""
        validValues.push(value);
      });

      // Add system roles
      validValues = validValues.concat(systemRoles.map(s => "\"" + s.role + "\""));

      if (!validValues.includes("\"" + value + "\"")) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } 
    
    if (key === 'store') {
      const allStores = await getAvailableStoresForUser(user);
      if (Object.entries(allStores).length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No store found.'
        });
      }

      const validValues = [];
      validValues.push("\"\"");
      Object.values(allStores).map(s => {
        const value = "\"" + s.name + "\""
        validValues.push(value);
      });

      // Store can be multiple
      const values = value.split(',');
      for (let i = 0; i < values.length; i++) {
        if (!validValues.includes("\"" + values[i] + "\"")) {
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid value, value must be one of: ' + validValues.join(', ')
          });
        }
      }
    } 
    
    if (key === 'node') {
      const allNodes = await getAvailableNodesForUser(user);
      if (Object.entries(allNodes).length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No user node found.'
        });
      }

      const validValues = [];
      validValues.push("\"\"");
      Object.values(allNodes).map(s => {
        const value = "\"" + s.name + "\""
        validValues.push(value);
      });
      if (!validValues.includes("\"" + value + "\"")) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    }

    // Update user settings
    const wasSuccessful = await updateUserSettings(username, key, value);

    if (wasSuccessful) {
      return res.status(200).json({ 
        success: true, 
        message: "Settings updated."
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
