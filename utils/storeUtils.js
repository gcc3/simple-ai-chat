import { vectaraQuery } from "./vectaraUtils.js";
import { mysqlQuery } from "./mysqlUtils.js";
import OpenAI from "openai";

// OpenAI
const openai = new OpenAI();

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

export async function searchMysqlStore(settings, input) {
  const host = settings.host;
  const port = settings.port;
  const user = settings.user;
  const password = settings.password;
  const database = settings.database;

  // Generate query
  const query = await generateMysqlQuery(input, settings.schema, settings.tableColumnsDef);
  if (!query) {
    return {
      success: false,
      error: "Failed to generate SQL query.",
    };
  }

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

async function generateMysqlQuery(input, schema, tableColumnsDef) {
  if (!input || input.trim().length === 0) {
    return null;
  }

  let messages = [];
  messages.push({ 
    role: "system",
    content: "You are an awesome MySQL query generator. " 
          + "User provides you schema and table, column defination. "
          + "You generate a valid MySQL query string and response with JSON format below: \n\n"
          + "{" + "\n"
          + "  \"query\": \"AWESOME_QUERY_STRING_TEXT\"" + "\n"
          + "}" + "\n\n"
          + "SQL should be written using this database schema: " + schema + "\n" +
          + "The table and its columns are defined as follows: " + tableColumnsDef + "\n"
          + "Note, sometimes the database is large, query with limit is recommended."
  });

  messages.push({
    role: "user",
    content: input,
  });

  try {
    let chatCompletion;
    chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: messages,
      temperature: 0,
      top_p: 1,
    });

    // Get result
    let result = null;
    const choices = chatCompletion.choices;
    if (choices && choices.length > 0) {
      result = choices[0].message.content;
    }
    return JSON.parse(result).query;
  } catch (error) {
    console.error(error);
    return null;
  }
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