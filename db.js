const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'cedar_o.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    country TEXT,
    school TEXT,
    program TEXT,
    start_date TEXT,
    notes TEXT,
    photo TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'upcoming',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reminder_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    days_before INTEGER NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('cabinet_email', '');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('gmail_user', '');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('gmail_pass', '');
`);

module.exports = db;