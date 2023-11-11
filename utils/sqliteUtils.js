import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import { formatUnixTimestamp } from './timeUtils.js';
import { generatePassword } from './userUtils.js';

const { verbose } = sqlite3;
const dbMode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

const createDatabaseFile = () => {
  return new Promise((resolve, reject) => {
    const db = new verbose.Database("./db.sqlite", dbMode, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        resolve(db);
      }
    });
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
          time_h TEXT,
          session INTEGER NOT NULL,
          user TEXT,
          ip_addr TEXT,
          browser TEXT,
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
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            settings TEXT,
            last_login TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        );`;

      db.run(createUsersTable, (err) => {
        if (err) {
          return reject(err);
        }
        
        resolve();
      });
    });

    console.log("Database created.\n");
  });
};

const getDatabaseConnection = async () => {
  try {
    await fs.access("./db.sqlite");
    // If the file exists, the above line won't throw an error
  } catch (err) {
    // If the error is because the file doesn't exist, create it
    if (err.code === 'ENOENT') {
      console.log("Database not exist, trying to create...");
      const db = await createDatabaseFile();
      await initializeDatabase(db);

      // Create root user with defatut settings
      await insertUser("root", generatePassword(), "root@localhost", "", "", "inactive", new Date());
      await updateUserSettings("root", "role", "");
      await updateUserSettings("root", "theme", "light");
      await updateUserSettings("root", "speak", "off");
      await updateUserSettings("root", "stats", "off");

      return db;
    } else {
      // If it's some other error, throw it
      throw err;
    }
  }

  // If the file exists, open the database
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
      db.all(`SELECT * FROM logs WHERE session = ? ORDER BY time DESC`, [session], (err, rows) => {
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

const insertLog = async (session, username, ip, browser, log) => {
  const time = Date.now();
  const db = await getDatabaseConnection();
  const time_h = formatUnixTimestamp(time);

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("INSERT INTO logs (time, time_h, session, user, ip_addr, browser, log) VALUES (?, ?, ?, ?, ?, ?, ?)");
      stmt.run([time, time_h, session, username, ip, browser, log], function (err) {
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

const getSessions = async () => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT DISTINCT session FROM logs ORDER BY session DESC`, [], (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  } finally {
    db.close();
  }
}

// II. users
const getUser = async (username) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, rows) => {
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

const getUsers = async () => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT username, email FROM users`, [], (err, rows) => {
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

const insertUser = async (username, password, email, settings, last_login, status, created_at) => {
  const db = await getDatabaseConnection();

  // Check if the username adheres to Unix naming conventions
  if (!/^[a-z][a-z0-9_-]*$/.test(username)) {
    throw new Error("Invalid username.");  // the username must adhere to Unix naming conventions.
  }

  try {
    return await new Promise((resolve, reject) => {
      // First, check if the username already exists
      db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
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
        const stmt = db.prepare("INSERT INTO users (username, password, email, settings, last_login, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run([username, password, email, settings, last_login, status, created_at], function (err) {
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

const deleteUser = async (username) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM users WHERE username = ?");
      stmt.run([username], function (err) {
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

const updateUserPassword = async (username, newPassword) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET password = ? WHERE username = ?");
      stmt.run([newPassword, username], function (err) {
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

const updateUserEmail = async (username, newEmail) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET email = ? WHERE username = ?");
      stmt.run([newEmail, username], function (err) {
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

const emailExists = async (email) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
      stmt.get([email], function (err, row) {
        if (err) {
          reject(err);
        }
        resolve(row);
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
};

const updateUserLastLogin = async (username, lastLogin) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET last_login = ? WHERE username = ?");
      stmt.run([lastLogin, username], function (err) {
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

const updateUserSettings = async (username, key, value) => {
  const db = await getDatabaseConnection();
  const user = await getUser(username);

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
      const stmt = db.prepare("UPDATE users SET settings = ? WHERE username = ?");
      stmt.run([settings, username], function (err) {
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

const updateUserStatus = async (username, status) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET status = ? WHERE username = ?");
      stmt.run([status, username], function (err) {
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

export {
  getLogs,
  insertLog,
  getSessions,
  getUsers,
  getUser,
  insertUser,
  deleteUser,
  updateUserPassword,
  updateUserEmail,
  updateUserLastLogin,
  updateUserSettings,
  updateUserStatus,
  emailExists,
  createDatabaseFile,
  initializeDatabase,
  getDatabaseConnection
};