import { getStore, deleteStore } from "utils/sqliteUtils.js";
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

  // Check role existance
  const store = await getStore(name, username);
  if (!store) {
    return res.status(200).json({ 
        success: false, 
        message: "Store not exists." 
      });
  }

  deleteStore(name, username);
  return res.status(200).json({ 
    success: true,
    message: "Store \"" + name + "\" is deleted.",
  });
}
