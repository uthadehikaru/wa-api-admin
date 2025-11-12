const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || './data/whatsapp.db';

// Ensure data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  }
});

// Promisify database methods
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbExec = promisify(db.exec.bind(db));

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create table if it doesn't exist
dbExec(`
  CREATE TABLE IF NOT EXISTS whatsapp_apis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    token TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'unknown',
    connection_status TEXT,
    last_checked TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).catch(err => console.error('Error creating table:', err));

// Add connection_status column if it doesn't exist (for existing databases)
db.run(`ALTER TABLE whatsapp_apis ADD COLUMN connection_status TEXT`, (err) => {
  // Ignore error if column already exists
});

// Create check_logs table if it doesn't exist
dbExec(`
  CREATE TABLE IF NOT EXISTS check_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    connection_status TEXT,
    response_data TEXT,
    error_message TEXT,
    checked_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (api_id) REFERENCES whatsapp_apis(id) ON DELETE CASCADE
  )
`).catch(err => console.error('Error creating check_logs table:', err));

// Helper functions for database operations
const dbHelpers = {
  getAll: async () => {
    try {
      return await dbAll('SELECT * FROM whatsapp_apis ORDER BY created_at DESC');
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      return await dbGet('SELECT * FROM whatsapp_apis WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const result = await dbRun(
        `INSERT INTO whatsapp_apis (name, endpoint, token, description, status)
         VALUES (?, ?, ?, ?, 'unknown')`,
        [data.name, data.endpoint, data.token, data.description || '']
      );
      return await dbHelpers.getById(result.lastID);
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      await dbRun(
        `UPDATE whatsapp_apis 
         SET name = ?, endpoint = ?, token = ?, description = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [data.name, data.endpoint, data.token, data.description || '', id]
      );
      return await dbHelpers.getById(id);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await dbRun('DELETE FROM whatsapp_apis WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  },

  updateStatus: async (id, status, lastChecked, connectionStatus = null) => {
    try {
      await dbRun(
        `UPDATE whatsapp_apis 
         SET status = ?, connection_status = ?, last_checked = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [status, connectionStatus, lastChecked, id]
      );
    } catch (error) {
      throw error;
    }
  },

  getAllForCheck: async () => {
    try {
      return await dbAll('SELECT id, endpoint, token FROM whatsapp_apis');
    } catch (error) {
      throw error;
    }
  },

  insertCheckLog: async (apiId, status, connectionStatus = null, responseData = null, errorMessage = null) => {
    try {
      const checkedAt = new Date().toISOString();
      // Convert responseData to JSON string if it's an object
      const responseDataStr = responseData ? JSON.stringify(responseData) : null;
      
      await dbRun(
        `INSERT INTO check_logs (api_id, status, connection_status, response_data, error_message, checked_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [apiId, status, connectionStatus, responseDataStr, errorMessage, checkedAt]
      );
    } catch (error) {
      throw error;
    }
  },

  getCheckLogs: async (apiId = null, limit = 100) => {
    try {
      if (apiId) {
        return await dbAll(
          'SELECT * FROM check_logs WHERE api_id = ? ORDER BY checked_at DESC LIMIT ?',
          [apiId, limit]
        );
      } else {
        return await dbAll(
          'SELECT * FROM check_logs ORDER BY checked_at DESC LIMIT ?',
          [limit]
        );
      }
    } catch (error) {
      throw error;
    }
  }
};

module.exports = { db, ...dbHelpers };
