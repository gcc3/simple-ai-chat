import sqlite3 from "sqlite3";
import { promises as fs } from "fs";
import { formatUnixTimestamp } from "./timeUtils.js";

const createDatabaseFile = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("./db.sqlite", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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
    db.run(
      `
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY,
        time INTEGER NOT NULL,
        time_h TEXT,
        session INTEGER NOT NULL,
        user TEXT,
        input_l INTEGER,
        input TEXT,
        output_l INTEGER,
        output TEXT,
        ip_addr TEXT,
        browser TEXT
      );`,
      (err) => {
        if (err) {
          return reject(err);
        }

        // Create users table
        db.run(
          `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        settings TEXT,
        last_login TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );`,
          (err) => {
            if (err) {
              return reject(err);
            }

            // Create roles table
            db.run(
              `CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY,
          role TEXT NOT NULL,
          prompt TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT
        );`,
              (err) => {
                if (err) {
                  return reject(err);
                }

                resolve();
              }
            );
          }
        );
      }
    );

    console.log("Database created.\n");
  });
};

const getDatabaseConnection = async () => {
  try {
    await fs.access("./db.sqlite");
    // If the file exists, the above line won't throw an error
  } catch (err) {
    // If the error is because the file doesn't exist, create it
    if (err.code === "ENOENT") {
      console.log("Database not exist, trying to create...");
      const db = await createDatabaseFile();
      await initializeDatabase(db);

      // Create root user with defatut settings
      await insertUser("root", "root_user", process.env.ROOT_PASS, "root@localhost", "", "", "inactive", new Date());
      await updateUserSettings("root", "theme", "light");
      await updateUserSettings("root", "speak", "off");
      await updateUserSettings("root", "stats", "off");
      await updateUserSettings("root", "fullscreen", "off");

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
const getLogs = async (session, limit = 50) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(
        `SELECT time, time_h, user, input, output FROM logs WHERE session = ? ORDER BY time DESC LIMIT ?`,
        [session, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        }
      );
    });
  } finally {
    db.close();
  }
};

const insertLog = async (session, username, input, output, ip, browser) => {
  const db = await getDatabaseConnection();
  const time = Date.now();
  const time_h = formatUnixTimestamp(time);
  const input_l = input.length;
  const output_l = output.length;

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(
        "INSERT INTO logs (time, time_h, session, user, input_l, input, output_l, output, ip_addr, browser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run([time, time_h, session, username, input_l, input, output_l, output, ip, browser], function (err) {
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
      db.all(`SELECT DISTINCT session FROM logs ORDER BY session DESC LIMIT ?`, [20], (err, rows) => {
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

const deleteSession = async (session) => {
  const db = await getDatabaseConnection();
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM logs WHERE session = ?`, [session], function (err) {
      db.close();
      if (err) {
        reject(err);
      } else {
        // this.changes holds the number of rows affected
        if (this.changes > 0) {
          resolve(`Successfully deleted session: ${session}`);
        } else {
          reject(`No session deleted with id: ${session}`);
        }
      }
    });
  });
};

const getUserSessions = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT DISTINCT session FROM logs WHERE user = ? ORDER BY session DESC LIMIT ?`, [user, 20], (err, rows) => {
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

// Get a single log by session (queryId)
// only get the first log that is newer than the given time
// if time is null, get first log of the session
const getSessionLog = async (sessionId, time = null, direction = ">") => {
  if (!time) {
    time = sessionId;
  }
  const order = direction === ">" ? "ASC" : "DESC";
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM logs WHERE session = ? AND time ${direction} ? ORDER BY time ${order}`, [sessionId, time], (err, rows) => {
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

// Count how many chats for a IP address for a date range
const countChatsForIP = async (ip, start, end) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM logs WHERE ip_addr = ? AND time >= ? AND time <= ?`, [ip, start, end], (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row.count);
      });
    });
  } finally {
    db.close();
  }
};

// Count how many chats for a user for a date range
const countChatsForUser = async (user, start, end) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM logs WHERE user = ? AND time >= ? AND time <= ?`, [user, start, end], (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row.count);
      });
    });
  } finally {
    db.close();
  }
};

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

const insertUser = async (username, role, password, email, settings, last_login, status, created_at) => {
  const db = await getDatabaseConnection();

  // Check if the username adheres to Unix naming conventions
  if (!/^[a-z][a-z0-9_-]*$/.test(username)) {
    throw new Error("Invalid username."); // the username must adhere to Unix naming conventions.
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
        const stmt = db.prepare(
          "INSERT INTO users (username, role, password, email, settings, last_login, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        stmt.run([username, role, password, email, settings, last_login, status, created_at, ""], function (err) {
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
      const stmt = db.prepare("UPDATE users SET password = ?, updated_at = ? WHERE username = ?");
      stmt.run([newPassword, new Date(), username], function (err) {
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
      const stmt = db.prepare("UPDATE users SET email = ?, updated_at = ? WHERE username = ?");
      stmt.run([newEmail, new Date(), username], function (err) {
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

const updateUserRole = async (username, newRole) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE username = ?");
      stmt.run([newRole, new Date(), username], function (err) {
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
    console.error("User not found.");
    return;
  }

  let newSettings = {};
  if (user.settings) {
    newSettings = JSON.parse(user.settings);
  }
  newSettings[key] = value;
  const settings = JSON.stringify(newSettings);

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET settings = ?, updated_at = ? WHERE username = ?");
      stmt.run([settings, new Date(), username], function (err) {
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

// III. roles
const getRole = async (roleName, createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM roles WHERE role = ? AND created_by = ?`, [roleName, createdBy], (err, rows) => {
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

const getUserRoles = async (createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM roles WHERE created_by = ?`, [createdBy], (err, rows) => {
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

const insertRole = async (roleName, prompt, createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      // First, check if the username already exists
      db.get("SELECT id FROM roles WHERE role = ? AND created_by = ?", [roleName, createdBy], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        // If the username already exists, reject the promise
        if (row) {
          reject(new Error("Role name already exists."));
          return;
        }

        // If the username doesn't exist, proceed with the insertion
        const stmt = db.prepare("INSERT INTO roles (role, prompt, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)");
        stmt.run([roleName, prompt, createdBy, new Date(), ""], function (err) {
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

const deleteRole = async (roleName, createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM roles WHERE role = ? AND created_by = ?");
      stmt.run([roleName, createdBy], function (err) {
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

const updateRolePrompt = async (roleName, newPrompt, createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE roles SET prompt = ?, updated_at = ? WHERE role = ? AND created_by = ?");
      stmt.run([newPrompt, new Date(), roleName, createdBy], function (err) {
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
  deleteSession,
  getUserSessions,
  getSessionLog,
  countChatsForIP,
  countChatsForUser,
  getUser,
  insertUser,
  deleteUser,
  updateUserPassword,
  updateUserEmail,
  updateUserRole,
  updateUserLastLogin,
  updateUserSettings,
  updateUserStatus,
  emailExists,
  createDatabaseFile,
  initializeDatabase,
  getDatabaseConnection,
  getRole,
  getUserRoles,
  insertRole,
  deleteRole,
  updateRolePrompt,
};
