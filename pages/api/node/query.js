import { getNode } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";
import { queryNodeAi } from "utils/nodeUtils";

export default async function handler(req, res) {
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
    const endpoint = settings.endpoint;
    if (!endpoint) {
      res.status(400).json({
        success: false,
        error: "Node not configured.",
      });
      return;
    }

    // Query
    const queryResult = await queryNodeAi(input, endpoint);

    // Veryfy format
    if (!queryResult.result) {
      res.status(500).json({
        success: false,
        error: "Node response format is unsatisfactory.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      result: queryResult.result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
