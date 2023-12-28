import { mysqlQuery } from "./mysqlUtils.js";

export async function generateStoreFunction(store) {
  const settings = JSON.parse(store.settings);

  // Engine description
  let engine_description = "";
  if (store.engine === "mysql") {
    engine_description = "This is a MySQL database";
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
  const table_columns_def = settings.tableColumnsDef || "No table and column definitions found.";

  let function_ = null;
  if (store.engine === "mysql") {
    function_ = {
      name: "search_store",
      description: engine_description + "\n" + settings.description,
      parameters: {
        type: "object",
        properties: {
          store: {
            type: "string",
            description: "The data store name. Use \"" + store.name + "\"",
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
