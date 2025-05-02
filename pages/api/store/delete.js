import { deleteStore } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { isInitialized } from "utils/storeUtils";
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
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Verify store name
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      error: "Node `name` is required and cannot be empty." 
    });
  }

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

  // Finally, delete store from database
  deleteStore(name, username);
  return res.status(200).json({ 
    success: true,
    message: "Store \"" + name + "\" is deleted.",
  });
}
