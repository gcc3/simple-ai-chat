import { authenticate } from "utils/authUtils";
import { queryNode, isNodeConfigured } from "utils/nodeUtils";
import { findNode } from "utils/nodeUtils";

export default async function handler(req, res) {
  // Check method
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { node, input } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({
      success: false,
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  try {
    const nodeInfo = await findNode(node, username);
    if (!nodeInfo) {
      res.status(404).json({
        success: false,
        error: "Node not found.",
      });
      return;
    }
    
    // Get settings
    const settings = JSON.parse(nodeInfo.settings);
    if (!isNodeConfigured(settings)) {
      res.status(400).json({
        success: false,
        error: "Node not configured. Use `:node set [key] [value]` to configure settings.",
      });
      return;
    }

    // Query
    console.log("Querying node...");
    const response = await queryNode(input, settings);

    // Return result
    if (!response.success) {
      res.status(400).json({
        success: false,
        error: "An error occurred during your request.",
      });
      return;
    }
    
    console.log("Query response:\n" + JSON.stringify(response, null, 2));
    res.status(200).json({
      success: true,
      result: response.result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
