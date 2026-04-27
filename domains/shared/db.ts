import Database from 'better-sqlite3';
import path from 'path';
import type { Transaction } from './types';

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

export function initializeDb(db: Database.Database) {
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
      prev_price_eur REAL,
      price_local REAL,
      prev_price_local REAL,
      currency TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      currency TEXT NOT NULL,
      total_value REAL NOT NULL,
      created_at TEXT,
      UNIQUE(date, currency)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // price_cache migrations
  const priceCacheCols = db.prepare('PRAGMA table_info(price_cache)').all() as { name: string }[];
  if (!priceCacheCols.some((c) => c.name === 'prev_price_eur')) {
    db.exec('ALTER TABLE price_cache ADD COLUMN prev_price_eur REAL');
  }
  if (!priceCacheCols.some((c) => c.name === 'prev_price_local')) {
    db.exec('ALTER TABLE price_cache ADD COLUMN prev_price_local REAL');
  }

  // snapshots migration: old schema had total_value_eur — drop and recreate
  const snapshotCols = db.prepare('PRAGMA table_info(snapshots)').all() as { name: string }[];
  if (snapshotCols.some((c) => c.name === 'total_value_eur')) {
    db.exec('DROP TABLE snapshots');
    db.exec(`
      CREATE TABLE snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        currency TEXT NOT NULL,
        total_value REAL NOT NULL,
        created_at TEXT,
        UNIQUE(date, currency)
      )
    `);
  }
}

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
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

export function getAllTransactions(): Transaction[] {
  const db = getDb();
  return db.prepare('SELECT * FROM transactions ORDER BY transaction_date DESC').all() as Transaction[];
}

export function getPriceCacheAge(): string | null {
  const db = getDb();
  const row = db.prepare('SELECT MAX(updated_at) as latest FROM price_cache').get() as { latest: string | null };
  return row.latest;
}
