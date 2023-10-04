const fs = require("fs");

const sqlite3 = require("sqlite3").verbose();

const createDatabaseFile = () => {
  return new sqlite3.Database("./db.sqlite", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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
            password TEXT NOT NULL,
            email TEXT,
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
  if (!fs.existsSync("./db.sqlite")) {
    console.log("Database not exist, trying to create.");

    const db = createDatabaseFile();
    await initializeDatabase(db);
    return db;
  }

  return new sqlite3.Database("./db.sqlite", sqlite3.OPEN_READWRITE, (err) => {
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
const getUser = async (name) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE name = ?`, [name], (err, rows) => {
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

const insertUser = async (name, password, settings, last_login) => {
  const db = await getDatabaseConnection();

  // Check if the name adheres to Unix naming conventions
  if (!/^[a-z][a-z0-9_-]*$/.test(name)) {
    throw new Error("Invalid username.");  // the name must adhere to Unix naming conventions.
  }

  try {
    return await new Promise((resolve, reject) => {
      // First, check if the username already exists
      db.get("SELECT id FROM users WHERE name = ?", [name], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        // If the username already exists, reject the promise
        if (row) {
          reject(new Error("Username already exists."));
          return;
        }

        // If the username doesn't exist, proceed with the insertion
        const stmt = db.prepare("INSERT INTO users (name, password, settings, last_login) VALUES (?, ?, ?, ?)");
        stmt.run([name, password, settings, last_login], function (err) {
          if (err) {
            reject(err);
            return;
          }
          // This `this.lastID` provides the ID of the last inserted row.
          resolve(this.lastID);
        });
        stmt.finalize();
      });
    });
  } finally {
    db.close();
  }
};

const deleteUser = async (userName) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM users WHERE name = ?");
      stmt.run([userName], function (err) {
        if (err) {
          reject(err);
        }
        if (this.changes > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

const updateUserPassword = async (userName, newPassword) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET password = ? WHERE name = ?");
      stmt.run([newPassword, userName], function (err) {
        if (err) {
          reject(err);
        }
        if (this.changes > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

const updateUserEmail = async (userName, newEmail) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET email = ? WHERE name = ?");
      stmt.run([newEmail, userName], function (err) {
        if (err) {
          reject(err);
        }
        if (this.changes > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

const updateUserLastLogin = async (userName, lastLogin) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET last_login = ? WHERE name = ?");
      stmt.run([lastLogin, userName], function (err) {
        if (err) {
          reject(err);
        }
        if (this.changes > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

const updateUserSettings = async (userName, key, value) => {
  const db = await getDatabaseConnection();
  const user = await getUser(userName);

  if (!user) {
    throw new Error("User not found.");
  }

  let newSettings = {};
  if (user.settings) {
    newSettings = JSON.parse(user.settings);
  }
  newSettings[key] = value;
  const settings = JSON.stringify(newSettings);

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET settings = ? WHERE name = ?");
      stmt.run([settings, userName], function (err) {
        if (err) {
          reject(err);
        }
        if (this.changes > 0) {
          resolve(true);
        } else {
          resolve(false);
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
  getUser,
  insertUser,
  deleteUser,
  updateUserPassword,
  updateUserEmail,
  updateUserLastLogin,
  updateUserSettings,
};
