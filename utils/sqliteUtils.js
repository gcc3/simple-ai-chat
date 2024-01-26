import sqlite3 from "sqlite3";
import { promises as fs } from "fs";
import { formatUnixTimestamp, getTimestamp } from "./timeUtils.js";
import { generatePassword } from "./userUtils.js";
import { getInitialSettings } from "./settingsUtils.js";
import { getSettings } from "./settingsUtils.js";

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
      `CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY,
        session INTEGER NOT NULL,
        time INTEGER NOT NULL,
        time_h TEXT,
        user TEXT,
        model TEXT,
        input_l INTEGER,
        input TEXT,
        output_l INTEGER,
        output TEXT,
        images TEXT,
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
            "group" TEXT,
            role TEXT NOT NULL,
            role_expires_at INTEGER,
            password TEXT NOT NULL,
            email TEXT,
            email_verified_at TEXT,
            balance REAL,
            usage REAL,
            settings TEXT,
            ip_addr TEXT,
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

                // Create stores table
                db.run(
                  `CREATE TABLE IF NOT EXISTS stores (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    engine TEXT,
                    settings TEXT,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT
                  );`,
                  (err) => {
                    if (err) {
                      return reject(err);
                    }

                    // Create nodes table
                    db.run(
                      `CREATE TABLE IF NOT EXISTS nodes (
                        id INTEGER PRIMARY KEY,
                        name TEXT NOT NULL,
                        owner TEXT NOT NULL,
                        settings TEXT NOT NULL,
                        created_by TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT
                      );`,
                      (err) => {
                        if (err) {
                          return reject(err);
                        }

                        // Create invites table
                        db.run(
                          `CREATE TABLE IF NOT EXISTS invites (
                            id INTEGER PRIMARY KEY,
                            user TEXT NOT NULL,
                            code TEXT NOT NULL,
                            invited_by TEXT NOT NULL,
                            created_at TEXT NOT NULL
                          );`,
                          (err) => {
                            if (err) {
                              return reject(err);
                            }

                            // Create sessions table
                            db.run(
                              `CREATE TABLE IF NOT EXISTS sessions (
                                id INTEGER PRIMARY KEY,
                                parent_id INTEGER,
                                text TEXT NOT NULL,
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
                  }
                );
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
      const settings = getInitialSettings("json_string", "light", "off");

      await insertUser("root", "root_user", null, process.env.ROOT_PASS, "root@localhost", 318, settings);
      await updateUserEmailVerifiedAt("root");

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
        `SELECT * FROM logs WHERE session = ? ORDER BY time DESC LIMIT ?`,
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

// Count session logs
const countLogs = async (session) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM logs WHERE session = ?`, [session], (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row.count);
      });
    });
  } finally {
    db.close();
  }
}

// Get log by time
const getLog = async (time) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM logs WHERE time = ?`, [time], (err, rows) => {
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

const insertLog = async (session, time, username, model, input_l, input, output_l, output, images, ip, browser) => {
  const db = await getDatabaseConnection();
  const time_h = formatUnixTimestamp(time);

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(
        "INSERT INTO logs (session, time, time_h, user, model, input_l, input, output_l, output, images, ip_addr, browser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run([session, time, time_h, username, model, input_l, input, output_l, output, images, ip, browser], function (err) {
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

const deleteUserLogs = async (username) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM logs WHERE user = ?");
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

const getSessions = async () => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT DISTINCT session FROM logs ORDER BY session DESC LIMIT ?`, [35], (err, rows) => {
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

const getUserSessions = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT DISTINCT session FROM logs WHERE user = ? ORDER BY session DESC LIMIT ?`, [user, 35], (err, rows) => {
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

// Get a single log by session
// only get the first log that is newer than the given time
// if time is null, get first log of the session
const getSessionLog = async (session, time = null, direction = ">") => {
  if (!time) {
    time = session;
  }
  const order = direction === ">" ? "ASC" : "DESC";
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM logs WHERE session = ? AND time ${direction} ? ORDER BY time ${order}`, [session, time], (err, rows) => {
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

// Use for getting node prompt
const getLastLogBySessionAndModel = async (session, model) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM logs WHERE session = ? AND model = ? ORDER BY id DESC`, [session, model], (err, rows) => {
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

// Count how many chats for a user for a date range
const countTokenForUserByModel = async (user, model, start, end) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT SUM(input_l) as totalInput, SUM(output_l) as totalOutput FROM logs WHERE user = ? AND model = ? AND time >= ? AND time <= ?`, [user, model, start, end], (err, row) => {
        if (err) {
          reject(err);
        }
        resolve({
          input: row.totalInput || 0,
          output: row.totalOutput || 0,
        });
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

// Count user by IP
const countUserByIP = async (ip) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM users WHERE ip_addr = ?`, [ip], (err, row) => {
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

const insertUser = async (username, role, role_expires_at, password, email, balance, settings) => {
  const db = await getDatabaseConnection();

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
        const group = username;
        const stmt = db.prepare(
          "INSERT INTO users (username, \"group\", role, role_expires_at, password, email, balance, usage, settings, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)"
        );
        stmt.run([username, group, role, role_expires_at, password, email, balance, 0, settings, "inactive", getTimestamp()], function (err) {
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

const softDeleteUser = async (username) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET username = ?, ip = ?, updated_at = ? WHERE username = ?");
      stmt.run(["__deleted__", null, getTimestamp(), username], function (err) {
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

const userJoinGroup = async (username, groupName) => {
  const db = await getDatabaseConnection();
  const user = await getUser(username);
  const origGroups = user.group ? user.group.split(",") : [];
  const newGroups = [...new Set([...origGroups, groupName])].join(",");

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET \"group\" = ?, updated_at = ? WHERE username = ?");
      stmt.run([newGroups, getTimestamp(), username], function (err) {
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

const userLeaveGroup = async (username, groupName) => {
  const db = await getDatabaseConnection();
  const user = await getUser(username);
  const origGroups = user.group ? user.group.split(",") : [];
  const newGroups = origGroups.filter((g) => g !== groupName).join(",");

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET \"group\" = ?, updated_at = ? WHERE username = ?");
      stmt.run([newGroups, getTimestamp(), username], function (err) {
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

// Resume user
// When user trying to register with an email has a deleted user.
const updateUsername = async (username, email, password) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET username = ?, password = ?, updated_at = ? WHERE email = ?");
      stmt.run([username, password, getTimestamp(), email], function (err) {
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
      stmt.run([newPassword, getTimestamp(), username], function (err) {
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

const updateUserBalance = async (username, newBalance) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET balance = ?, updated_at = ? WHERE username = ?");
      stmt.run([newBalance, getTimestamp(), username], function (err) {
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
      stmt.run([newEmail, getTimestamp(), username], function (err) {
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

const updateUserEmailVerifiedAt = async (username) => {
  const db = await getDatabaseConnection();
  const timestamp = getTimestamp();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET email_verified_at = ?, updated_at = ? WHERE username = ?");
      stmt.run([timestamp, timestamp, username], function (err) {
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
      stmt.run([newRole, getTimestamp(), username], function (err) {
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

const extendUserRole = async (username, extendTo) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET role_expires_at = ?, updated_at = ? WHERE username = ?");
      stmt.run([extendTo, getTimestamp(), username], function (err) {
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

const getUserByEmail = async (email) => {
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

const getUserByCreatedAt = async (createdAt) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("SELECT * FROM users WHERE created_at = ?");
      stmt.get([createdAt], function (err, row) {
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

const updateUserIPAddr = async (username, ip) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET ip_addr = ? WHERE username = ?");
      stmt.run([ip, username], function (err) {
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

const updateUserIPAndLastLogin = async (username, ip, lastLogin) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET ip_addr = ?, last_login = ? WHERE username = ?");
      stmt.run([ip, lastLogin, username], function (err) {
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

    // Trim user settings
    // Check if user settings are all available
    // If not available, remove it
    const availableSettings = getSettings();
    for (const [key, value] of Object.entries(newSettings)) {
      if (!availableSettings[key]) {
        delete newSettings[key];
      }
    }
    for (const [key, value] of Object.entries(availableSettings)) {
      if (!newSettings[key]) {
        newSettings[key] = value;
      }
    }
  }
  newSettings[key] = value;
  const settings = JSON.stringify(newSettings);

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE users SET settings = ?, updated_at = ? WHERE username = ?");
      stmt.run([settings, getTimestamp(), username], function (err) {
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

const countUserRoles = async (createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM roles WHERE created_by = ?`, [createdBy], (err, rows) => {
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
        stmt.run([roleName, prompt, createdBy, getTimestamp(), null], function (err) {
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

const deleteUserRoles = async (createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM roles WHERE created_by = ?");
      stmt.run([createdBy], function (err) {
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
      stmt.run([newPrompt, getTimestamp(), roleName, createdBy], function (err) {
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

// IV. stores
// Get store by name
const getStore = async (name, user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM stores WHERE name = ? AND (owner = ? OR created_by = ?)`, [name, user, user], (err, rows) => {
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

const getUserStores = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM stores WHERE owner = ? OR created_by = ?`, [user, user], (err, rows) => {
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

const countUserStores = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM stores WHERE owner = ? OR created_by = ?`, [user, user], (err, rows) => {
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

const insertStore = async (name, engine, settings, creator) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      // First, check if the username already exists
      db.get(`SELECT id FROM stores WHERE name = ? AND owner = ?`, [name, creator], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        // If the username already exists, reject the promise
        if (row) {
          reject(new Error("Same name store already exists."));
          return;
        }

        // If the username doesn't exist, proceed with the insertion
        const stmt = db.prepare(`INSERT INTO stores (name, owner, engine, settings, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        stmt.run([name, creator, engine, settings, creator, getTimestamp(), null], function (err) {
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

const deleteStore = async (name, owner) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(`DELETE FROM stores WHERE name = ? AND owner = ?`);
      stmt.run([name, owner], function (err) {
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

const deleteUserStores = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM stores WHERE owner = ?");
      stmt.run([user], function (err) {
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

const updateStoreOwner = async (name, oldOwner, newOwner) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(`UPDATE stores SET owner = ?, updated_at = ? WHERE name = ? AND owner = ?`);
      stmt.run([newOwner, getTimestamp(), name, oldOwner], function (err) {
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

const updateStoreSetting = async (name, user, key, value) => {
  const db = await getDatabaseConnection();
  const store = await getStore(name, user);

  // Check if the store exists
  if (!store) {
    console.error("Store not found.");
    return;
  }

  let newSettings = {};
  if (store.settings) {
    newSettings = JSON.parse(store.settings);
  }
  newSettings[key] = value;
  const settings = JSON.stringify(newSettings);

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE stores SET settings = ?, updated_at = ? WHERE name = ? AND owner = ?");
      stmt.run([settings, getTimestamp(), name, user], function (err) {
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

const updateStoreSettings = async (name, user, newSettings) => {
  const db = await getDatabaseConnection();
  const store = await getStore(name, user);

  // Check if the store exists
  if (!store) {
    console.error("Store not found.");
    return;
  }

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE stores SET settings = ?, updated_at = ? WHERE name = ? AND owner = ?");
      stmt.run([newSettings, getTimestamp(), name, user], function (err) {
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

// V. Nodes
// Get node by name
const getNode = async (name, user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM nodes WHERE name = ? AND (owner = ? OR created_by = ?)`, [name, user, user], (err, rows) => {
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

const getUserNodes = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM nodes WHERE owner = ? OR created_by = ?`, [user, user], (err, rows) => {
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

const countUserNodes = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM nodes WHERE owner = ? OR created_by = ?`, [user, user], (err, rows) => {
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

const insertNode = async (name, settings, creator) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      // First, check if the username already exists
      db.get(`SELECT id FROM nodes WHERE name = ? AND owner = ?`, [name, creator], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        // If the username already exists, reject the promise
        if (row) {
          reject(new Error("Same name node already exists."));
          return;
        }

        // If the username doesn't exist, proceed with the insertion
        const stmt = db.prepare(`INSERT INTO nodes (name, owner, settings, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
        stmt.run([name, creator, settings, creator, getTimestamp(), null], function (err) {
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

const deleteNode = async (name, owner) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(`DELETE FROM nodes WHERE name = ? AND owner = ?`);
      stmt.run([name, owner], function (err) {
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

const deleteUserNodes = async (owner) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("DELETE FROM nodes WHERE owner = ?");
      stmt.run([owner], function (err) {
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

const updateNodeOwner = async (name, oldOwner, newOwner) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(`UPDATE nodes SET owner = ?, updated_at = ? WHERE name = ? AND owner = ?`);
      stmt.run([newOwner, getTimestamp(), name, oldOwner], function (err) {
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

const updateNodeSettings = async (name, owner, key, value) => {
  const db = await getDatabaseConnection();
  const node = await getNode(name, owner);

  // Check if the node exists
  if (!node) {
    console.error("Node not found.");
    return;
  }

  let newSettings = {};
  if (node.settings) {
    newSettings = JSON.parse(node.settings);
  }
  newSettings[key] = value;
  const settings = JSON.stringify(newSettings);

  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare("UPDATE nodes SET settings = ?, updated_at = ? WHERE name = ? AND owner = ?");
      stmt.run([settings, getTimestamp(), name, owner], function (err) {
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

// VI. Invites
const insertInvite = async (user, code, invitedBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO invites (user, code, invited_by, created_at) VALUES (?, ?, ?, ?)`);
      stmt.run([user, code, invitedBy, getTimestamp()], function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        // This `this.lastID` provides the ID of the last inserted row.
        resolve(this.lastID);
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
}

const countInvites = async (user) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS count FROM invites WHERE user = ? OR invited_by = ?`, [user, user], (err, rows) => {
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

// VII. Sessions
const getSession = async (id) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM sessions WHERE id = ?`, [id], (err, rows) => {
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

// Insert a session to sessions table
const insertSession = async (id, parentId, createdBy) => {
  const db = await getDatabaseConnection();
  try {
    return await new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO sessions (id, parent_id, text, created_by, created_at) VALUES (?, ?, ?, ?, ?)`);
      stmt.run([id, parentId, "", createdBy, getTimestamp()], function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        // This `this.lastID` provides the ID of the last inserted row.
        resolve(this.lastID);
      });
      stmt.finalize();
    });
  } finally {
    db.close();
  }
}

export {
  getLogs,
  countLogs,
  getLog,
  insertLog,
  deleteUserLogs,
  getSessions,
  getUserSessions,
  getSessionLog,
  getLastLogBySessionAndModel,
  countChatsForIP,
  countChatsForUser,
  countTokenForUserByModel,
  getUser,
  countUserByIP,
  insertUser,
  deleteUser,
  softDeleteUser,
  userJoinGroup,
  userLeaveGroup,
  updateUsername,
  updateUserPassword,
  updateUserBalance,
  updateUserEmail,
  updateUserEmailVerifiedAt,
  updateUserRole,
  extendUserRole,
  updateUserIPAddr,
  updateUserIPAndLastLogin,
  updateUserSettings,
  updateUserStatus,
  getUserByEmail,
  getUserByCreatedAt,
  createDatabaseFile,
  initializeDatabase,
  getDatabaseConnection,
  getRole,
  getUserRoles,
  countUserRoles,
  insertRole,
  deleteRole,
  deleteUserRoles,
  updateRolePrompt,
  getStore,
  getUserStores,
  countUserStores,
  insertStore,
  deleteStore,
  deleteUserStores,
  updateStoreOwner,
  updateStoreSetting,
  updateStoreSettings,
  getNode,
  getUserNodes,
  countUserNodes,
  insertNode,
  deleteNode,
  deleteUserNodes,
  updateNodeOwner,
  updateNodeSettings,
  insertInvite,
  countInvites,
  getSession,
  insertSession,
};
