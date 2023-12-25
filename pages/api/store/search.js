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
    const store = await getStore(store, username);
    if (!store) {
      res.status(404).json({
        success: false,
        error: "Store not found.",
      });
      return;
    }
    
    // Get settings
    const settings = JSON.parse(store.settings);

    // Check is initialized
    if (!settings.engine) {
      res.status(400).json({
        success: false,
        error: "Store not initialized. Use `:store init [engine]` to initialize a data store.",
      });
      return;
    }

    if (settings.engine === "vectara") {
      const queryResult = await searchVectaraStore(settings, text);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: queryResult.error,
        });
        return;
      }
      res.status(200).json({
        success: true,
        result: queryResult.result,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: "Invalid engine for search.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}

async function searchVectaraStore(settings, text) {
  const corpusId = settings.corpusId;
  const apiKey = settings.apiKey;
  const threshold = settings.threshold;
  const numberOfResults = settings.numberOfResults;
  if (!apiKey || !corpusId || !threshold || !numberOfResults) {
    return {
      success: false,
      error: "Store not configured.",
    };
  }

  // Query
  const queryResult = await vectaraQuery(text, corpusId, apiKey, threshold, numberOfResults);
  return {
    success: true,
    result: queryResult,
  };
}