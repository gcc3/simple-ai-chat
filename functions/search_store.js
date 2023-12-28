import { mysqlQuery } from "utils/mysqlUtils";

export default async function searchStore(paramObject) {
  const { host, port, user, password, database, query } = paramObject;

  const dbConfig = {
    host,
    port,
    user,
    password,
    database,
  };

  // Execute the query
  const queryResult = await mysqlQuery(dbConfig, query);
  return {
    success: true,
    message: JSON.stringify(queryResult, null, 2),
  }
}
