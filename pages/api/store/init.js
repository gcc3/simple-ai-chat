import { updateStoreSettings } from "utils/sqliteUtils.js";
import { authenticate } from "utils/authUtils.js";
import { createVectaraCorpus, generateVectaraApiKey, createVectaraJtwToken } from "utils/vectaraUtils.js";
import { mysqlQuery } from "utils/mysqlUtils.js";
import { findStore } from "utils/storeUtils.js";

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
      error: authResult.error
    });
  }
  const { id, username } = authResult.user;

  // Check store existance
  const store = await findStore(name, username);
  if (!store) {
    return res.status(400).json({ 
      success: false, 
      error: "Store not exist. Use command `:store add [name]` to create a store." 
    });
  }

  // Check store ownership
  if (store.owner !== username && store.created_by !== username) {
    return res.status(401).json({ 
      success: false, 
      error: "You are not the owner or creator of this store."
    });
  }

  // Check engine existance
  if (!store.engine) {
    return res.status(400).json({ 
      success: false, 
      error: "Engine not specified." 
    });
  }

  console.log("Initializing store \"" + name + "\"...");

  if (store.engine === "vectara") {
    const initResult = await initializeVectaraStore(store);
    if (!initResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: initResult.error
      });
    }

    const settings = JSON.stringify(initResult.settings);
    updateStoreSettings(name, username, settings);
    return res.status(200).json({ 
      success: true,
      message: "Store \"" + name + "\" is initialized. You can use command `:store \"" + name + "\"` to check store status and settings.",
    });
  }

  if (store.engine === "mysql") {
    const initResult = await initializeMysqlStore(store);
    if (!initResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: initResult.error
      });
    }

    const settings = JSON.stringify(initResult.settings);
    updateStoreSettings(name, username, settings);
    return res.status(200).json({ 
      success: true,
      message: "Store \"" + name + "\" is initialized. You can use command `:store \"" + name + "\"` to check store status and settings.",
    });
  }

  return res.status(400).json({ 
    success: false, 
    error: "Engine not supported, supported engine: \"vectara\", \"mysql\"."
  });
}

async function initializeMysqlStore(store) {
  let settings = JSON.parse(store.settings);

  if (!settings.host || !settings.port || !settings.user || !settings.password || !settings.database) {
    return {
      success: false,
      error: "Host, port, user, password, database are required."
    };
  }

  const dbConfig = {
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    table: settings.table,
  };

  // Generate database schema string
  let database_schema_string = "";
  let databaseSchemas = [];

  // Get table names
  const tableNames = await mysqlQuery(dbConfig, "SHOW TABLES");
  if (!tableNames) {
    return {
      success: false,
      error: "Failed to get table names."
    };
  }

  // Get column names
  for (const tableName of tableNames) {
    const table = tableName[Object.keys(tableName)[0]];
    if (dbConfig.table && dbConfig.table !== table) {
      // Skip if table name is specified and not match
      continue;
    }

    // Get column names
    const columnNames = await mysqlQuery(dbConfig, `SHOW COLUMNS FROM ${table}`);
    if (!columnNames) {
      return {
        success: false,
        error: "Failed to get column names in table \"" + table + "\"."
      };
    }

    const columnNamesArray = columnNames.map(columnName => columnName.Field);
    databaseSchemas.push({ "table_name": table, "column_names": columnNamesArray });
  }

  // Generate table descriptions and database schema string
  const tableDescriptions = databaseSchemas.map(table => {
    return `Table: ${table.table_name}\nColumns: ${table.column_names.join(', ')}`;
  });
  database_schema_string = tableDescriptions.join('\n\n');

  settings = {
    ...settings,
    schema: database_schema_string,
  };

  return {
    success: true,
    settings: settings
  }
}

async function initializeVectaraStore(store) {
  const { name, owner } = store;
  let settings = JSON.parse(store.settings);

  if (!settings.apiKey || !settings.customerId || !settings.clientId || !settings.clientSecret) {
    return { 
      success: false, 
      error: "Vectara API key, customer ID, client ID and client secret are required."
    };
  }

  // Get JWT token
  const jwtToken = await createVectaraJtwToken(settings.clientId, settings.clientSecret, settings.customerId, settings.apiKey);
  if (!jwtToken) {
    console.log("Failed to get JTW token.");
    return { 
      success: false, 
      error: "Failed to create store." 
    };
  }

  console.log("Got JTW token.");

  // Create store
  const corpusName = "i-" + Date.now();
  const description = "store: " + name + ", created by: " + owner;
  const corpusId = await createVectaraCorpus(corpusName, description, jwtToken, settings.customerId);
  if (!corpusId) {
    console.log("Failed to create corpus.");
    return { 
      success: false, 
      error: "Failed to create store." 
    };
  }

  console.log("Created corpus: " + corpusId);

  // Get API key
  const apiKey = await generateVectaraApiKey(corpusId, jwtToken, settings.customerId);
  if (!apiKey) {
    console.log("Failed to get API key.");
    return { 
      success: false, 
      error: "Failed to create store." 
    };
  }

  console.log("Got API key.");

  settings = {
    ...settings,
    corpusId: corpusId,
    apiKey: apiKey,
  };

  return {
    success: true,
    settings: settings
  }
}
