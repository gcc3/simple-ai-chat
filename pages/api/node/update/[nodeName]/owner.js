import { updateNodeOwner, getUser } from 'utils/sqliteUtils.js';
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
  const { owner : newOwner  } = req.body;
  if (!newOwner) {
    return res.status(400).json({ 
      success: false,
      error: 'Owner is required.' 
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

    // Check if the user exists
    const user = await getUser(newOwner);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Owner not found.' 
      });
    }

    const wasSuccessful = await updateNodeOwner(nodeName, username, newOwner);
    if (wasSuccessful) {
      return res.status(200).json({ 
        success: true, 
        message: "Node owner changed."
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to update owner.'
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
