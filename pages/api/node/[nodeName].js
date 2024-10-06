import { authenticate } from 'utils/authUtils';
import { checkIsNodeConfigured, verifyNodeSettings, pingNode } from 'utils/nodeUtils';
import { findNode } from 'utils/nodeUtils';

export default async function (req, res) {
  const { nodeName } = req.query;

  try {
    const authResult = authenticate(req);
    if (!authResult.success) {
      return res.status(401).json({ 
        success: false,
        error: authResult.error
      });
    }
    const authUser = authResult.user;

    // Check if role exists in user roles
    const node = await findNode(nodeName, authUser.username);
    if (!node) {
      return res.status(404).json({ 
        success: false,
        error: "Node not exists."
      });
    }

    const settings = JSON.parse(node.settings);
    if (node) {
      return res.status(200).json({ 
        result: {
          node: node.name,
          owner: node.owner,
          created_by: node.created_by,
          settings: settings,
          status: {
            ping: settings.useDirect ? "-" : await pingNode(settings),
            configured: checkIsNodeConfigured(settings),
            messages: verifyNodeSettings(settings),
          }
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        error: "Node not exists."
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request."
    });
  }
}
