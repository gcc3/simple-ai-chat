import { mysqlQuery } from "utils/mysqlUtils";
import { authenticate } from "utils/authUtils";
import { getStore } from "utils/sqliteUtils";

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

async function generateStoreFunction(store) {
  const settings = JSON.parse(store.settings);

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

  // Get column names
  for (const tableName of tableNames) {
    const table = tableName[Object.keys(tableName)[0]];
    if (dbConfig.table && dbConfig.table !== table) {
      // Skip if table name is specified and not match
      continue;
    }

    // Get column names
    const columnNames = await mysqlQuery(dbConfig, `SHOW COLUMNS FROM ${table}`);
    const columnNamesArray = columnNames.map(columnName => columnName.Field);
    databaseSchemas.push({ "table_name": table, "column_names": columnNamesArray });
  }

  // Generate table descriptions and database schema string
  const tableDescriptions = databaseSchemas.map(table => {
    return `Table: ${table.table_name}\nColumns: ${table.column_names.join(', ')}`;
  });
  database_schema_string = tableDescriptions.join('\n\n');

  // Table and colume definitions
  const table_columns_def = store.tableColumnsDef || "No table and column definitions found.";

  let function_ = null;
  if (settings.engine === "mysql") {
    function_ = {
      name: "search_store",
      description: store.description,
      parameters: {
        type: "object",
        properties: {
          host: {
            type: "string",
            description: "The hostname of the database.",
          },
          user: {
            type: "string",
            description: "The username for the database.",
          },
          password: {
            type: "string",
            description: "The password for the database.",
          },
          database: {
            type: "string",
            description: "The name of the database.",
          },
          query: {
            type: "string",
            description: ` 
            """
            SQL query extracting info to answer the user's question.
            SQL should be written using this database schema:
            ${database_schema_string}
            The table and its columns are defined as follows:
            ${table_columns_def}
            The query should be returned in plain text, not in JSON.
            """
            `
          },
        },
        required: ["host", "user", "password", "database", "query"],
      }
    };
  }
  return function_;
}
