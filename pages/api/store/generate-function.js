import { authenticate } from "utils/authUtils";
import { getStore } from "utils/sqliteUtils";
import { generateStoreFunction } from "utils/storeUtils";

export default async function (req, res) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

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

  const { store } = req.query;
  const storeInfo = await getStore(store, username);
  if (!storeInfo) {
    return res.status(400).json({ 
      success: false, 
      error: "Store not exists." 
    });
  }

  const function_ = await generateStoreFunction(storeInfo);
  if (!function_) {
    return res.status(400).json({ 
      success: false, 
      error: "Store engine not supported." 
    });
  }

  return res.status(200).json({ 
    success: true,
    function: function_,
  });
}
