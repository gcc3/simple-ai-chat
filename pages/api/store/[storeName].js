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

      // Mask settings
      let setting = JSON.parse(store.settings);
      if (store.engine === "vectara") {
        setting = {
          ...setting,
          apiKey: maskString(setting.apiKey),
          customerId: maskString(setting.customerId),
          clientId: maskString(setting.clientId),
          clientSecret: maskString(setting.clientSecret),
        }
      } else if (store.engine === "mysql") {
        setting = {
          ...setting,
          password: maskString(setting.password, 0),
        }
      }

      if (store) {
        return res.status(200).json({ 
          result: {
            id: store.id,
            store: store.name,
            owner: store.owner,
            created_by: store.created_by,
            engine: store.engine,
            settings: setting,
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

// Mask string to * except last 4 characters
function maskString(str, suffixLength = 4) {
  if (!str) return str;
  if (str.length < suffixLength) return str;
  return str.substring(0, str.length - suffixLength).replace(/./g, '*') + str.substring(str.length - suffixLength);
}