const mysql = require('mysql');

/**
 * Execute a query against a MySQL database.
 *
 * @param {string} host - The hostname of the database.
 * @param {string} user - The username for the database.
 * @param {string} password - The password for the database.
 * @param {string} database - The name of the database.
 * @param {string} query - The SQL query to execute.
 * @returns {Promise} - A promise that resolves with the query results.
 */
function executeQuery({ host, user, password, database, query }) {
  return new Promise((resolve, reject) => {
    // Create a connection to the database
    const connection = mysql.createConnection({ host, user, password, database });

    // Connect to the database
    connection.connect((err) => {
      if (err) {
        return reject(err);
      }

      // Execute the query
      connection.query(query, (error, results) => {
        // Close the connection
        connection.end();

        if (error) {
          return reject(error);
        }

        // Resolve the promise with the results
        resolve(results);
      });
    });
  });
}

module.exports = executeQuery;