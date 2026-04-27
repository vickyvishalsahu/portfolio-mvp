import { getDb } from '@/domains/shared/db';
import type { RawEmail } from '@/domains/shared/types';
import type { FetchedEmail } from './types';

export const insertRawEmail = (email: FetchedEmail) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO raw_emails (id, sender, subject, body, received_at, parsed)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  return stmt.run(email.id, email.sender, email.subject, email.body, email.received_at);
};

export const getUnparsedEmails = (): RawEmail[] => {
  const db = getDb();
  return db.prepare('SELECT * FROM raw_emails WHERE parsed = 0').all() as RawEmail[];
};

export const markEmailParsed = (emailId: string) => {
  const db = getDb();
  db.prepare('UPDATE raw_emails SET parsed = 1 WHERE id = ?').run(emailId);
};

export const getRawEmailCount = (): number => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM raw_emails').get() as { count: number };
  return row.count;
};

export const getParsedEmailCount = (): number => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM raw_emails WHERE parsed = 1').get() as { count: number };
  return row.count;
};

export const getSelectedBrokerIds = (): string[] => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'selected_brokers'").get() as { value: string } | undefined;
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setSelectedBrokerIds = (ids: string[]): void => {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('selected_brokers', JSON.stringify(ids));
};

export const getBrokerCustomDomains = (): Record<string, string[]> => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'broker_custom_domains'").get() as { value: string } | undefined;
  if (!row?.value) return {};
  try {
    const parsed = JSON.parse(row.value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const setBrokerCustomDomains = (overrides: Record<string, string[]>): void => {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('broker_custom_domains', JSON.stringify(overrides));
};
