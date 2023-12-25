import { getStore, insertStore } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";

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

  // Check store existance
  const sameNameStore = await getStore(name, username);
  if (sameNameStore) {
    return res.status(400).json({ 
      success: false, 
      error: "Store already exists." 
    });
  }

  // Store setting initialized as empty
  // Use :store init [engine] to initialize the store
  const settings = JSON.stringify({
    "engine": "",
  });

  insertStore(name, settings, username);
  return res.status(200).json({ 
    success: true,
    message: "Store \"" + name + "\" is created. You can use command `:store \"" + name + "\"` to check store status and settings.",
  });
}
