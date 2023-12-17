import { vectaraQuery } from "utils/vectaraUtils";
import { getStore } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";

export default async function handler(req, res) {
  const { store, text } = req.body;

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
    const storeInfo = await getStore(store, username);
    if (!storeInfo) {
      res.status(404).json({
        success: false,
        error: "Store not found.",
      });
      return;
    }
    
    // Get settings
    const settings = JSON.parse(storeInfo.settings);
    const corpusId = settings.corpusId;
    const apiKey = settings.apiKey;
    const threshold = settings.threshold;
    const numberOfResults = settings.numberOfResults;
    if (!apiKey || !corpusId || !threshold || !numberOfResults) {
      res.status(400).json({
        success: false,
        error: "Store not configured.",
      });
      return;
    }

    // Query
    const queryResult = await vectaraQuery(text, corpusId, apiKey, threshold, numberOfResults);
    res.status(200).json({
      success: true,
      result: queryResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
