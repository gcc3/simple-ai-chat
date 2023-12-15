import { vectaraQuery } from "utils/vectaraUtils";
import { getStore } from "utils/sqliteUtils";
import { authenticate } from "utils/authUtils";

export default async function handler(req, res) {
  const { store, word } = req.body;

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
    
    // Query
    const { corpus_id } = storeInfo;
    const queryResult = await vectaraQuery(word, corpus_id);
    if (!queryResult) {
      res.status(200).json({
        success: true,
        message: "No results found.",
        result: {
          word,
          store,
        },
      });
      return;
    } else {
      res.status(200).json({
        success: true,
        message: "Results found.",
        result: {
          word,
          store,
          result: queryResult,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}
