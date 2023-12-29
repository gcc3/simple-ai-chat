import { vectaraQuery } from "./vectaraUtils.js";
import { mysqlQuery } from "./mysqlUtils.js";

export async function searchVectaraStore(settings, query) {
  const corpusId = settings.corpusId;
  const apiKey = settings.apiKey;
  const threshold = settings.threshold;
  const numberOfResults = settings.numberOfResults;
  const customerId = settings.customerId;

  if (!apiKey || !corpusId || !threshold || !numberOfResults || !customerId) {
    return {
      success: false,
      error: "Store not configured. Use `:store set [key] [value]` to configure the store settings.",
    };
  }

  // Query
  const queryResult = await vectaraQuery(query, corpusId, apiKey, threshold, numberOfResults, customerId);
  if (queryResult && queryResult.length > 0) {
    let result = "";
    for (let i = 0; i < queryResult.length; i++) {
      result += "Document: " + queryResult[i].document + "\n" +
                (queryResult[i].title && "Title: " + queryResult[i].title) + "\n" +
                "Score: " + queryResult[i].score + "\n" +
                "Content:\n" + queryResult[i].content + "\n\n";
    }
    return {
      success: true,
      message: result,
    };
  } else {
    return {
      success: true,
      message: "No results found.",
    };
  }
}

export async function searchMysqlStore(settings, query) {
  const host = settings.host;
  const port = settings.port;
  const user = settings.user;
  const password = settings.password;
  const database = settings.database;

  // Check if settings are set
  if (!host || !port || !user || !password || !database) {
    let error = "";
    if (!host) { error = "No `host`."; }
    else if (!port) { error = "No `port`."; }
    else if (!user) { error = "No `user`."; }
    else if (!password) { error = "No `password`."; }
    else if (!database) { error = "No `database`."; }

    return {
      success: false,
      error: error + " Use `:store set [key] [value]` to configure the store settings.",
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
  // TODO use generate instead
  const queryResult = await mysqlQuery(dbConfig, query);
  return {
    success: true,
    message: JSON.stringify(queryResult, null, 2),
  };
}

export async function generateStoreFunction(store) {
  const settings = JSON.parse(store.settings);

  // Engine description
  let engine_description = "";
  if (store.engine === "mysql") {
    engine_description = "This is a MySQL database";
  }

  // Table and colume definitions
  const database_schema_string = settings.schema || "No database schema found.";
  const table_columns_def = settings.tableColumnsDef || "No table and column definitions found.";

  let function_ = null;
  if (store.engine === "mysql") {
    function_ = {
      name: "store_search",
      description: engine_description + "\n" + settings.description,
      parameters: {
        type: "object",
        properties: {
          store: {
            type: "string",
            description: "A JSON string of data store access configuration. In this case use \"" + JSON.stringify(store) + "\"",
          },
          query: {
            type: "string",
            description: "SQL query extracting info to answer the user's question. " + "\n" +
                         "SQL should be written using this database schema: " + database_schema_string + "\n" +
                         "The table and its columns are defined as follows: " + table_columns_def + "\n" +
                         "The query should be returned in plain text, not in JSON."
          },
        },
        required: ["store", "query"],
      }
    };
  }
  return function_;
}

export function isInitialized(engine, settings) {
  let isInitialized = false;
  if (engine === "mysql") {
    if (settings.host !== "" && settings.user !== "" && settings.password !== "" && settings.database !== "" && settings.schema !== "") {
      isInitialized = true;
    }
  } else if (engine === "vectara") {
    if (settings.apiKey !== "" && settings.customerId !== "" && settings.clientId !== "" && settings.clientSecret !== "" && settings.corpusId !== "") {
      isInitialized = true;
    }
  }
  return isInitialized;
}