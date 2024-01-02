import { updateUserSettings, getUser, getUserRoles, getUserStores, getUserNodes } from 'utils/sqliteUtils.js';
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

  // Get user
  const user = await getUser(username);

  // Input and validation
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ 
      success: false,
      error: 'Key is required.'
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
    const validKeys = ['theme', 'speak', 'stats', 'eval', "fullscreen", "role", "store", "node", "groupPassword"];
    if (!validKeys.includes(key)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid key, key must be one of:' + validKeys.join(', ')
      });
    }

    // Check if value is valid
    if (key === 'theme') {
      const validValues = ['light', 'dark', 'terminal'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } else if (key === 'speak') {
      const validValues = ['on', 'off'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } else if (key === 'stats') {
      const validValues = ['on', 'off'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } else if (key === 'fullscreen') {
      const validValues = ['default', 'split', 'off'];
      if (!validValues.includes(value)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
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
      const validValues = [];
      validValues.push("\"\"");
      Object.values(userRoles).map(s => {
        const value = "\"" + s.role + "\""
        validValues.push(value);
      });
      if (!validValues.includes("\"" + value + "\"")) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } else if (key === 'store') {
      const userStores = await getUserStores(username);
      const groups = user.group.split(',');
      const groupStores = [];
      await groups.map(async g => {
        if (g === username) return;
        const groupStores = await getUserStores(g);
        groupStores.push(groupStores);
      });

      let systemStores = [];
      if (username != "root") {
        systemStores = await getUserStores('root');
      }

      const allStores = userStores.concat(groupStores).concat(systemStores);
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
      if (!validValues.includes("\"" + value + "\"")) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid value, value must be one of: ' + validValues.join(', ')
        });
      }
    } else if (key === 'node') {
      const userNodes = await getUserNodes(username);
      const groups = user.group.split(',');
      const groupNodes = [];
      await groups.map(async g => {
        if (g === username) return;
        const groupNodes = await getUserNodes(g);
        groupNodes.push(groupNodes);
      });

      let systemNodes = [];
      if (username != "root") {
        systemNodes = await getUserNodes('root');
      }

      const allNodes = userNodes.concat(groupNodes).concat(systemNodes);
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
