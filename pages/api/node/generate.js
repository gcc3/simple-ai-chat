import { getNode } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";
import { queryNodeAi, isNodeConfigured } from "utils/nodeUtils";

export default async function handler(req, res) {
  const { node, input } = req.body;
  if (!node || !input) {
    res.status(400).json({
      success: false,
      error: "Missing parameters.",
    });
    return;
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

  try {
    const nodeInfo = await getNode(node, username);
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
    const queryResult = await queryNodeAi(input, settings.endpoint);

    // Return result
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        error: "An error occurred during your request.",
      });
      return;
    }
    
    console.log("Query Result:\n" + JSON.stringify(queryResult, null, 2));
    res.status(200).json({
      success: true,
      message: queryResult.message,
      result: queryResult.result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
