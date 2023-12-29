import { getUser, getNode, countUserNodes, insertNode } from "utils/sqliteUtils.js";
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
  const user = await getUser(username);

  // Check node existance
  const sameNameNode = await getNode(name, username);
  if (sameNameNode) {
    return res.status(400).json({ 
      success: false, 
      error: "Node already exists." 
    });
  }

  // Node count limit
  const sameUserNodesCount = (await countUserNodes(username)).count;
  if (sameUserNodesCount >= 99) {
    return res.status(400).json({ 
      success: false,
      error: "Your can create at most 99 nodes."
    });
  }

  console.log("Creating node \"" + name + "\"...");

  const settings = JSON.stringify({
    "endpoint": "",
    "query_parameter_for_input": "input",
  });

  insertNode(name, settings, username);
  return res.status(200).json({ 
    success: true,
    message: "Node \"" + name + "\" is created. You can use command `:node set [key] [value]` to configure it, and use command `:node \"" + name + "\"` to check node status and settings. Node `" + name + "` is now active.",
  });
}
