import { getNode, deleteNode } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";

export default async function (req, res) {
  // Check if the method is POST
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed.',
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Check role existance
  const node = await getNode(name, username);
  if (!node) {
    return res.status(404).json({ 
      success: false, 
      error: "Node not exists." 
    });
  }

  const settings = JSON.parse(node.settings);
  if (!settings.apiKey || !settings.corpusId) {
    return res.status(400).json({ 
      success: false, 
      error: "Node has invalid settings." 
    });
  }

  // Finally, delete node from database
  deleteNode(name, username);
  return res.status(200).json({ 
    success: true,
    message: "Node \"" + name + "\" is deleted.",
  });
}
