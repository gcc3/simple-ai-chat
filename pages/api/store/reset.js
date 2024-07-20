import { authenticate } from "utils/authUtils.js";
import { createVectaraJtwToken, resetVectaraCorpus } from "utils/vectaraUtils";
import { findStore } from "utils/storeUtils.js";

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
      message: 'Authentication failed.',
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Check role existance
  const store = await findStore(name, username);
  if (!store) {
    return res.status(404).json({ 
      success: false, 
      error: "Store not exists." 
    });
  }

  // Check store ownership
  if (store.owner !== username && store.created_by !== username) {
    return res.status(401).json({ 
      success: false, 
      error: "You are not the owner or creator of this store."
    });
  }

  const settings = JSON.parse(store.settings);
  if (!store.engine) {
    return res.status(400).json({ 
      success: false, 
      error: "Store not initialized. Use `:store init [engine]` to initialize a data store." 
    });
  }

  if (store.engine === "vectara") {
    const vectaraResult = await resetVectaraStore(settings);
    if (!vectaraResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: vectaraResult.error
      });
    } else {
      return res.status(200).json({ 
        success: true,
        message: "Store \"" + name + "\" is reset.",
      });
    }
  }

  return res.status(400).json({ 
    success: false, 
    error: "Invalid engine for reset." 
  });
}

async function resetVectaraStore(settings) {
  if (!settings.apiKey || !settings.corpusId || !settings.clientId || !settings.clientSecret || !settings.customerId) {
    return { 
      success: false, 
      error: "Store has invalid settings." 
    };
  }

  // Get JWT token
  const jwtToken = await createVectaraJtwToken(settings.clientId, settings.clientSecret, settings.customerId, settings.apiKey);
  if (!jwtToken) {
    console.log("Failed to create JWT token.");
    return { 
      success: false,
      error: "Failed to reset data store.",
    };
  }

  // Reset store
  if (!await resetVectaraCorpus(settings.corpusId, jwtToken, settings.customerId)) {
    console.log("Failed to reset corpus.");
    return {
      success: false,
      error: "Failed to reset data store.",
    };
  }
}