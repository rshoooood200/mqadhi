import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'app.db')
const db = new Database(dbPath)

// إنشاء الجداول إذا لم تكن موجودة
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '👤',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT DEFAULT '',
    isPurchased INTEGER DEFAULT 0,
    image TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prices (
    id TEXT PRIMARY KEY,
    store TEXT NOT NULL,
    price REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    itemId TEXT NOT NULL,
    FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS custom_stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    monthlyBudget REAL DEFAULT 0,
    spentAmount REAL DEFAULT 0,
    startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    userId TEXT UNIQUE NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    productName TEXT NOT NULL,
    store TEXT NOT NULL,
    price REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    userId TEXT NOT NULL
  );
`)

export default db
