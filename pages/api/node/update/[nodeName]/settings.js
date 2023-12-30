import { updateNodeSettings } from 'utils/sqliteUtils.js';
import { authenticate } from 'utils/authUtils.js';
import { findNode } from 'utils/nodeUtils.js';

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

  // Node name
  const { nodeName } = req.query;
  if (!nodeName) {
    return res.status(400).json({ 
      success: false,
      error: 'Node name is required.' 
    });
  }

  // Input and validation
  const { key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ 
      success: false,
      error: 'Key and value are required.' 
    });
  }

  try {
    // Check if the node exists
    const node = await findNode(nodeName, username);
    if (!node) {
      return res.status(400).json({ 
        success: false, 
        error: 'Node not found.' 
      });
    }

    // Check node ownership
    if (node.owner !== username && node.created_by !== username) {
      return res.status(401).json({ 
        success: false, 
        error: 'You are not the owner or creator of this node.'
      });
    }

    // TODO check if key and value is valid
    const wasSuccessful = await updateNodeSettings(nodeName, username, key, value);
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
