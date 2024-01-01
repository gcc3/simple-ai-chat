import { deleteNode } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { findNode } from "utils/nodeUtils.js";

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
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Check role existance
  const node = await findNode(name, username);
  if (!node) {
    return res.status(404).json({ 
      success: false, 
      error: "Node not exists." 
    });
  }

  // Check node ownership
  if (node.owner !== username && node.created_by !== username) {
    return res.status(401).json({ 
      success: false, 
      error: "You are not the owner or creator of this node."
    });
  }

  // Finally, delete node from database
  deleteNode(name, username);
  return res.status(200).json({ 
    success: true,
    message: "Node \"" + name + "\" is deleted.",
  });
}
