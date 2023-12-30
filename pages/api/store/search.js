import { authenticate } from "utils/authUtils";
import { searchVectaraStore, searchMysqlStore, isInitialized } from "utils/storeUtils";
import { findStore } from "utils/storeUtils.js";

export default async function handler(req, res) {
  const { store, query } = req.body;

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
    const storeInfo = await findStore(store, username);
    if (!storeInfo) {
      res.status(404).json({
        success: false,
        error: "Store not found.",
      });
      return;
    }
    
    // Get settings
    const settings = JSON.parse(storeInfo.settings);

    // Check is initialized
    if (!isInitialized(storeInfo.engine, settings)) {
      res.status(400).json({
        success: false,
        error: "Store not initialized. Use `:store init [engine]` to initialize a data store.",
      });
      return;
    }

    if (storeInfo.engine === "vectara") {
      const queryResult = await searchVectaraStore(settings, query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: queryResult.error,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: queryResult.message,
      });
      return;
    }

    if (storeInfo.engine === "mysql") {
      const queryResult = await searchMysqlStore(settings, query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: queryResult.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Query: " + queryResult.query + "\nResult: \n" + queryResult.message,
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
