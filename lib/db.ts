import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'portfolio.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_emails (
      id TEXT PRIMARY KEY,
      sender TEXT,
      subject TEXT,
      body TEXT,
      received_at TEXT,
      parsed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id TEXT,
      asset_type TEXT,
      ticker TEXT,
      name TEXT,
      quantity REAL,
      price REAL,
      currency TEXT,
      transaction_type TEXT,
      transaction_date TEXT,
      broker TEXT,
      raw_text TEXT,
      confidence TEXT
    );

    CREATE TABLE IF NOT EXISTS price_cache (
      ticker TEXT PRIMARY KEY,
      price_eur REAL,
      price_local REAL,
      currency TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      total_value_eur REAL,
      created_at TEXT
    );
  `);
}

export function insertRawEmail(email: {
  id: string;
  sender: string;
  subject: string;
  body: string;
  received_at: string;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO raw_emails (id, sender, subject, body, received_at, parsed)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  return stmt.run(email.id, email.sender, email.subject, email.body, email.received_at);
}

export function getUnparsedEmails() {
  const db = getDb();
  return db.prepare('SELECT * FROM raw_emails WHERE parsed = 0').all();
}

export function markEmailParsed(emailId: string) {
  const db = getDb();
  db.prepare('UPDATE raw_emails SET parsed = 1 WHERE id = ?').run(emailId);
}

export function insertTransaction(tx: {
  email_id: string;
  asset_type: string;
  ticker: string | null;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  transaction_type: string;
  transaction_date: string;
  broker: string;
  raw_text: string;
  confidence: string;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO transactions (email_id, asset_type, ticker, name, quantity, price, currency, transaction_type, transaction_date, broker, raw_text, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    tx.email_id, tx.asset_type, tx.ticker, tx.name, tx.quantity, tx.price,
    tx.currency, tx.transaction_type, tx.transaction_date, tx.broker,
    tx.raw_text, tx.confidence
  );
}

export function getAllTransactions() {
  const db = getDb();
  return db.prepare('SELECT * FROM transactions ORDER BY transaction_date DESC').all();
}

export function getRawEmailCount() {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM raw_emails').get() as { count: number };
  return row.count;
}

export function getParsedEmailCount() {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM raw_emails WHERE parsed = 1').get() as { count: number };
  return row.count;
}

export function getPriceCacheAge(): string | null {
  const db = getDb();
  const row = db.prepare('SELECT MAX(updated_at) as latest FROM price_cache').get() as { latest: string | null };
  return row.latest;
}
