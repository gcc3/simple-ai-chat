const mysql = require('mysql2');

function mysqlQuery({ host, port, user, password, database}, query) {
  return new Promise((resolve, reject) => {
    // Create a connection to the database
    const connection = mysql.createConnection({ host, port, user, password, database });

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

function testConnection({ host, port, user, password, database }) {
  return new Promise((resolve, reject) => {
    // Create a connection to the database
    const connection = mysql.createConnection({ host, port, user, password, database });

    // Connect to the database
    connection.connect((err) => {
      if (err) {
        return reject(err);
      }

      // Close the connection
      connection.end();

      // Resolve the promise
      resolve();
    });
  });
}

export {
  mysqlQuery,
  testConnection
};
