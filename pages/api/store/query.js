import { mysqlQuery } from "utils/mysqlUtils";

export default async function handler(req, res) {
  const { store, query } = req.body;

  try {
    const storeInfo = JSON.parse(store);

    // Only for mysql
    if (storeInfo.engine !== "mysql") {
      res.status(400).json({
        success: false,
        error: "Invalid engine for query.",
      });
      return;
    }

    // Get settings
    const settings = JSON.parse(storeInfo.settings);

    // Check is initialized
    if (!storeInfo.engine) {
      res.status(400).json({
        success: false,
        error: "Store not initialized. Use `:store init [engine]` to initialize a data store.",
      });
      return;
    }

    if (storeInfo.engine === "mysql") {
      const queryResult = await queryMysqlStore(settings, query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: queryResult.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: queryResult.message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: "Invalid engine for query.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request.",
    });
  }
}

async function queryMysqlStore(settings, query) {
  const host = settings.host;
  const port = settings.port;
  const user = settings.user;
  const password = settings.password;
  const database = settings.database;
  if (!host || !port || !user || !password || !database) {
    return {
      success: false,
      error: "Store not configured. Use `:store set [key] [value]` to configure the store settings.",
    };
  }

  const dbConfig = {
    host,
    port,
    user,
    password,
    database,
  }

  // Query
  const queryResult = await mysqlQuery(dbConfig, query);
  return {
    success: true,
    message: JSON.stringify(queryResult, null, 2),
  };
}
