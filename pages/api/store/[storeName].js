import { authenticate } from 'utils/authUtils';
import { findStore, isInitialized } from 'utils/storeUtils';
import { testConnection } from 'utils/mysqlUtils';

export default async function (req, res) {
  const { storeName, verbose } = req.query;

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

    // File store
    if (store.engine === "file") {
      // If verbose is true, then return the file content
      if (verbose === "true") {
        const files = settings.files || [];
        if (files.length === 0) {
          return res.status(400).json({
            success: false,
            error: "No files found in the store.",
          });
        }

        // Initialize an array to store all matches
        const fileContentList = [];

        // Loop through each file and fetch the content
        for (const file of files) {
          try {
            const response = await fetch(file);
            const fileContent = await response.text();
            fileContentList.push({ file, content: fileContent });
          } catch (error) {
            console.error(`Error fetching file ${file}:`, error);
          }
        }

        return res.status(200).json({ 
          result: {
            id: store.id,
            store: store.name,
            owner: store.owner,
            created_by: store.created_by,
            engine: store.engine,
            settings: settings,
            status: {
              available: settings.files.length > 0,
            },
            content: fileContentList, // Return the file content
          },
        });
      }

      return res.status(200).json({ 
        result: {
          id: store.id,
          store: store.name,
          owner: store.owner,
          created_by: store.created_by,
          engine: store.engine,
          settings: settings,
          status: {
            available: settings.files.length > 0,
          },
        },
      });
    }

    // MySQL store
    if (store.engine === "mysql") {
      return res.status(200).json({ 
        result: {
          id: store.id,
          store: store.name,
          owner: store.owner,
          created_by: store.created_by,
          engine: store.engine,
          settings: {
            ...settings,
            password: maskString(settings.password, 0),
          },
          status: {
            initialized: isInitialized(store.engine, settings),
            connected: await testConnection({ host: settings.host, port: settings.port, user: settings.user, password: settings.password, database: settings.database })
                                      .then(() => true)
                                      .catch(() => false),
          },
        },
      });
    }
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