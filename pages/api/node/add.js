import { getUser, countUserNodes, insertNode } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { findNode, getInitNodeSettings } from "utils/nodeUtils.js";

export default async function (req, res) {
  // Check method
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
  const user = await getUser(username);

  // Verify node name
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      error: "Node `name` is required and cannot be empty." 
    });
  }
  if (name.length > 32) {
    return res.status(400).json({ 
      success: false, 
      error: "Node `name` is at most 32 characters long." 
    });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({ 
      success: false, 
      error: "Node `name` can only contain letters, numbers, underscores and hyphens." 
    });
  }

  // Check node existance
  const sameNameNode = await findNode(name, username);
  if (sameNameNode) {
    return res.status(409).json({ 
      success: false, 
      error: "Node already exists." 
    });
  }

  // Node count limit
  const sameUserNodesCount = (await countUserNodes(username)).count;
  if (sameUserNodesCount >= 10) {
    return res.status(400).json({ 
      success: false,
      error: "Your can create at most 10 nodes."
    });
  }

  // Create node
  console.log("Creating node \"" + name + "\"...");
  const settings = JSON.stringify(getInitNodeSettings());
  insertNode(name, settings, username);

  return res.status(200).json({ 
    success: true,
    message: "Node \"" + name + "\" is created. You can use command `:node set [key] [value]` to configure it. Use command `:node [name?]` to check node status and settings. Node `" + name + "` is now active.",
  });
}
