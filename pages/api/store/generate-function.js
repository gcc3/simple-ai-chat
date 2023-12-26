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
  };

  // Generate database schema string
  let database_schema_string = "";
  let databaseSchemas = [];
  const tableNames = await mysqlQuery(dbConfig, "SHOW TABLES");
  for (const tableName of tableNames) {
    const table = tableName[Object.keys(tableName)[0]];
    const columnNames = await mysqlQuery(dbConfig, `SHOW COLUMNS FROM ${table}`);
    const columnNamesArray = columnNames.map(columnName => columnName.Field);
    databaseSchemas.push({ "table_name": table, "column_names": columnNamesArray });
  }
  const tableDescriptions = databaseSchemas.map(table => {
    return `Table: ${table.table_name}\nColumns: ${table.column_names.join(', ')}`;
  });
  database_schema_string = tableDescriptions.join('\n\n');

  let function_ = null;
  if (settings.engine === "mysql") {
    function_ = {
      name: 'search_store_' + store.id,
      description: store.description,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: `
            """
            SQL query extracting info to answer the user's question.
            SQL should be written using this database schema:
            ${database_schema_string}
            The query should be returned in plain text, not in JSON.
            """
            `
          },
        },
        required: ["query"],
      }
    };
  }
  return function_;
}