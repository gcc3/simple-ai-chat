import { getStore, deleteStore } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { createVectaraJtwToken, deleteVectaraCorpus, deleteVectaraApiKey } from "utils/vectaraUtils";

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

  // Check role existance
  const store = await getStore(name, username);
  if (!store) {
    return res.status(404).json({ 
      success: false, 
      error: "Store not exists." 
    });
  }

  const settings = JSON.parse(store.settings);
  if (!settings.apiKey || !settings.corpusId) {
    return res.status(400).json({ 
      success: false, 
      error: "Store has invalid settings." 
    });
  }

  // Get JWT token
  const jwtToken = await createVectaraJtwToken();
  if (!jwtToken) {
    console.log("Failed to create JWT token.");
    return res.status(400).json({ 
      success: false,
      error: "Failed to delete data store.",
    });
  }

  // Delete API key
  if (!await deleteVectaraApiKey(settings.apiKey, jwtToken)) {
    console.log("Failed to delete API key.");
    return res.status(400).json({
      success: false,
      error: "Failed to delete data store.",
    });
  }

  // Delete store
  if (!await deleteVectaraCorpus(settings.corpusId, jwtToken)) {
    console.log("Failed to delete corpus.");
    return res.status(400).json({
      success: false,
      error: "Failed to delete data store.",
    });
  }

  // Finally, delete store from database
  deleteStore(name, username);
  return res.status(200).json({ 
    success: true,
    message: "Store \"" + name + "\" is deleted.",
  });
}
