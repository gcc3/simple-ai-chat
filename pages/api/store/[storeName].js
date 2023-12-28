import { getStore } from 'utils/sqliteUtils';
import { authenticate } from 'utils/authUtils';

export default async function (req, res) {
  const { storeName } = req.query;

  try {
    const authResult = authenticate(req);
    if (!authResult.success) {
      return res.status(401).json({ 
        success: false,
        error: authResult.error
      });
    }

    if (authResult.success) {
      // Check if role exists in user roles
      const store = await getStore(storeName, authResult.user.username);
      if (store) {
        return res.status(200).json({ 
          result: {
            id: store.id,
            store: store.name,
            owner: store.owner,
            created_by: store.created_by,
            engine: store.engine,
            settings: JSON.parse(store.settings),
          },
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "Store not exists."
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred during your request.",
      error: error
    });
  }
}
