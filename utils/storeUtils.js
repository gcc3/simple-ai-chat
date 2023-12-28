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
