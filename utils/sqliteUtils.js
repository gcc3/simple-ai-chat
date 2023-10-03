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

// Initialize the database
const initializeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    
    // Create logs table
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY,
          time INTEGER NOT NULL,
          session INTEGER NOT NULL,
          log TEXT NOT NULL
      );`;
      
    db.run(createLogsTable, (err) => {
      if (err) {
        return reject(err);
      }
      
      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            pass TEXT NOT NULL,
            settings TEXT,
            last_login TEXT
        );`;
        
      db.run(createUsersTable, (err) => {
        if (err) {
          return reject(err);
        }
        
        resolve();
      });
    });
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

// I. logs
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

// II. users
const getUsers = async (name) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM users WHERE name = ?`, [name], (err, rows) => {
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

const insertUser = async (name, pass, settings, last_login) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("INSERT INTO users (name, pass, settings, last_login) VALUES (?, ?, ?, ?)");
      stmt.run([name, pass, settings, last_login], function (err) {
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

const deleteUser = async (userId) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM users WHERE id = ?");
      stmt.run([userId], function (err) {
        if (err) {
          reject(err);
        }
        // This `this.changes` provides the number of rows deleted.
        if (this.changes > 0) {
          resolve(true); // Indicates successful deletion
        } else {
          resolve(false); // No rows were deleted (maybe user not found)
        }
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

const updateUserPass = async (userId, newPass) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET pass = ? WHERE id = ?");
      stmt.run([newPass, userId], function (err) {
        if (err) {
          reject(err);
        }
        // This `this.changes` provides the number of rows updated.
        if (this.changes > 0) {
          resolve(true); // Indicates successful update
        } else {
          resolve(false); // No rows were updated (maybe user not found)
        }
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

const updateUserLastLogin = async (userId, lastLogin) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET last_login = ? WHERE id = ?");
      stmt.run([lastLogin, userId], function (err) {
        if (err) {
          reject(err);
        }
        // This `this.changes` provides the number of rows updated.
        if (this.changes > 0) {
          resolve(true); // Indicates successful update
        } else {
          resolve(false); // No rows were updated (maybe user not found)
        }
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

module.exports = {

  // logs
  getLogs,
  insertLog,

  // users
  getUsers,
  insertUser,
  deleteUser,
  updateUserPass,
  updateUserLastLogin

};