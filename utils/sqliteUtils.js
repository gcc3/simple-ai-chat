const fs = require('fs');

const sqlite3 = require('sqlite3').verbose();

const createDatabaseFile = () => {
  return new sqlite3.Database('./db.sqlite', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error(err.message);
      return null;
    }
  });
};

const getDatabaseConnection = async () => {
  if (!fs.existsSync('./db.sqlite')) {
    console.log("Database not exist, trying to create.")

    const db = createDatabaseFile();
    await initializeDatabase(db);
    return db;
  }
  
  return new sqlite3.Database('./db.sqlite', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
  });
};

// Initialize the database
const initializeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    const createLogsTable = `
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY,
        time INTEGER NOT NULL,
        session INTEGER NOT NULL,
        log TEXT NOT NULL
    );`;
    db.run(createLogsTable, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

// Get logs by session
const getLogs = async (session) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT log FROM logs WHERE session = ? ORDER BY time DESC`, [session], (err, rows) => {
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
  const db = await getDatabaseConnection();
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