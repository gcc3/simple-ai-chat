const sqlite3 = require('sqlite3').verbose();

const getDatabaseConnection = () => {
  return new sqlite3.Database('../db.sqlite', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
  });
};

// Initialize the database
const initializeDatabase = () => {
  const db = getDatabaseConnection();
  if (!db) {
    console.error('Failed to establish database connection.');
    return;
  }

  const createLogsTable = `
  CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY,
      time INTEGER NOT NULL,
      session INTEGER NOT NULL,
      log TEXT NOT NULL
  );`;

  db.run(createLogsTable);
  db.close();
};

initializeDatabase();

// Logs
const getLogs = async () => {
  const db = getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM logs`, [], (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  } finally {
    db.close();
  }
};

const insertLog = async (time, session, log) => {
  const db = getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("INSERT INTO logs (time, session, log) VALUES (?, ?, ?)");
      stmt.run([time, session, log], function (err) {
        if (err) {
          reject(err);
        }
        // This `this.lastID` provides the ID of the last inserted row.
        resolve(this.lastID);
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

module.exports = {
  getLogs,
  insertLog
};