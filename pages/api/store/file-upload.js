import { authenticate } from "utils/authUtils.js";
import { findStore } from "utils/storeUtils.js";
import { updateStoreSetting } from 'utils/sqliteUtils.js';

export default async function (req, res) {
  // Check method
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name, files } = req.body;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
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

  if (store.engine === "file") {
    const settings = JSON.parse(store.settings) || {};
    const currentFilesList = settings.files || [];
    const newFilesList = [...currentFilesList, ...files];

    // TODO check if key and value is valid
    const wasSuccessful = await updateStoreSetting(store.name, username, "files", newFilesList);
    if (wasSuccessful) {
      return res.status(200).json({ 
        success: true, 
        message: "Store setting updated."
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to update store settings or user not found.'
      });
    }
  }

  return res.status(400).json({ 
    success: false, 
    error: "Invalid engine for data upload." 
  });
}
