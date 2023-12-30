import { getUser, getStore } from 'utils/sqliteUtils';
import { authenticate } from 'utils/authUtils';
import { isInitialized } from 'utils/storeUtils';

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

  // Get user
  const user = await getUser(authUesr.username);

  // Find store
  let store = null;

  // 1. user stores
  store = await getStore(storeName, user.username);

  // 2. group stores
  if (!store) {
    const groups = user.group.split(',');
    for (const group of groups) {
      if (!group || group === user.username) {
        continue;
      }
      store = await getStore(storeName, group);
      if (store) {
        break;
      }
    }
  }

  // 3. system stores
  if (!store) {
    store = await getStore(storeName, 'root');
  }

  if (!store) {
    return res.status(200).json({
      success: false,
      message: "Store not exists."
    });
  }

  try {
    // Mask settings
    let settings = JSON.parse(store.settings);
    if (store.engine === "vectara") {
      settings = {
        ...settings,
        apiKey: maskString(settings.apiKey),
        customerId: maskString(settings.customerId),
        clientId: maskString(settings.clientId),
        clientSecret: maskString(settings.clientSecret),
      }
    } else if (store.engine === "mysql") {
      settings = {
        ...settings,
        password: maskString(settings.password, 0),
      }
    }

    return res.status(200).json({ 
      result: {
        id: store.id,
        store: store.name,
        owner: store.owner,
        created_by: store.created_by,
        engine: store.engine,
        settings,
        initialized: isInitialized(store.engine, settings)
      },
    });
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