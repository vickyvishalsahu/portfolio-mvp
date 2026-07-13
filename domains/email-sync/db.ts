import { getDb, getSetting, setSetting } from '@/domains/shared/db';
import type { RawEmail, Institution } from '@/domains/shared/types';
import type { FetchedEmail } from './types';
import {
  INSERT_RAW_EMAIL,
  GET_UNPARSED_EMAILS,
  MARK_EMAIL_PARSED,
  MARK_EMAIL_FAILED,
  GET_FAILED_EMAILS,
  RETRY_EMAIL,
  RESOLVE_EMAIL,
  GET_EMAIL_COUNT,
  GET_PARSED_EMAIL_COUNT,
} from './constants';

type RawEmailRow = {
  id: string; sender: string; subject: string; body: string; received_at: string; parsed: number; parse_error: string | null;
};

const toRawEmail = (row: RawEmailRow): RawEmail => ({
  id: row.id,
  sender: row.sender,
  subject: row.subject,
  body: row.body,
  receivedAt: row.received_at,
  parsed: row.parsed,
  parseError: row.parse_error,
});

export const insertRawEmail = (email: FetchedEmail) => {
  const db = getDb();
  return db.prepare(INSERT_RAW_EMAIL).run(email.id, email.sender, email.subject, email.body, email.receivedAt);
};

export const getUnparsedEmails = (): RawEmail[] => {
  const db = getDb();
  const rows = db.prepare(GET_UNPARSED_EMAILS).all() as RawEmailRow[];
  return rows.map(toRawEmail);
};

export const markEmailParsed = (emailId: string) => {
  const db = getDb();
  db.prepare(MARK_EMAIL_PARSED).run(emailId);
};

export const markEmailFailed = (emailId: string, message: string) => {
  const db = getDb();
  db.prepare(MARK_EMAIL_FAILED).run(message, emailId);
};

export const getFailedEmails = (): RawEmail[] => {
  const db = getDb();
  const rows = db.prepare(GET_FAILED_EMAILS).all() as RawEmailRow[];
  return rows.map(toRawEmail);
};

export const retryEmail = (emailId: string) => {
  const db = getDb();
  db.prepare(RETRY_EMAIL).run(emailId);
};

export const resolveEmail = (emailId: string) => {
  const db = getDb();
  db.prepare(RESOLVE_EMAIL).run(emailId);
};

export const getRawEmailCount = (): number => {
  const db = getDb();
  const row = db.prepare(GET_EMAIL_COUNT).get() as { count: number };
  return row.count;
};

export const getParsedEmailCount = (): number => {
  const db = getDb();
  const row = db.prepare(GET_PARSED_EMAIL_COUNT).get() as { count: number };
  return row.count;
};

export const getSelectedInstitutions = (): Institution[] => {
  const value = getSetting('custom_institutions');
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setSelectedInstitutions = (institutions: Institution[]): void => {
  setSetting('custom_institutions', JSON.stringify(institutions));
};
