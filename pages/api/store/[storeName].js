import { authenticate } from 'utils/authUtils';
import { findStore, isInitialized } from 'utils/storeUtils';
import { testConnection } from 'utils/mysqlUtils';

export default async function (req, res) {
  const { storeName } = req.query;

  // Authentication
  const authResult = authenticate(req);
  if (!authResult.success) {
    return res.status(401).json({ 
      success: false,
      error: authResult.error
    });
  }
  const authUesr = authResult.user;

  // Find store
  const store = await findStore(storeName, authUesr.username);
  if (!store) {
    return res.status(200).json({
      success: false,
      error: "Store not exists."
    });
  }

  try {
    // Mask settings
    let settings = JSON.parse(store.settings);
    let status = {};

    // MySQL store
    if (store.engine === "mysql") {
      status = {
        initialized: isInitialized(store.engine, settings),
        connected: await testConnection({ host: settings.host, port: settings.port, user: settings.user, password: settings.password, database: settings.database })
                                  .then(() => true)
                                  .catch(() => false),
      };
      settings = {
        ...settings,
        password: maskString(settings.password, 0),
      };
    }

    return res.status(200).json({ 
      result: {
        id: store.id,
        store: store.name,
        owner: store.owner,
        created_by: store.created_by,
        engine: store.engine,
        settings,
        status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}

// Mask string to * except last 4 characters
function maskString(str, suffixLength = 4) {
  if (!str) return str;
  if (str.length < suffixLength) return str;
  return str.substring(0, str.length - suffixLength).replace(/./g, '*') + str.substring(str.length - suffixLength);
}