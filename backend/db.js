const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database at', dbPath);
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    unit TEXT,
    category TEXT,
    brand TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT,
    image TEXT
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    oldStock INTEGER NOT NULL,
    newStock INTEGER NOT NULL,
    changedBy TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(productId) REFERENCES products(id)
  )`);
});

module.exports = db;
