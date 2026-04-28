import { getDb } from '@/domains/shared/db';
import type { RawEmail } from '@/domains/shared/types';
import type { FetchedEmail } from './types';
import {
  INSERT_RAW_EMAIL,
  GET_UNPARSED_EMAILS,
  MARK_EMAIL_PARSED,
  GET_EMAIL_COUNT,
  GET_PARSED_EMAIL_COUNT,
  GET_SELECTED_BROKERS,
  GET_BROKER_CUSTOM_DOMAINS,
  UPSERT_SETTING,
} from './constants';

export const insertRawEmail = (email: FetchedEmail) => {
  const db = getDb();
  return db.prepare(INSERT_RAW_EMAIL).run(email.id, email.sender, email.subject, email.body, email.received_at);
};

export const getUnparsedEmails = (): RawEmail[] => {
  const db = getDb();
  return db.prepare(GET_UNPARSED_EMAILS).all() as RawEmail[];
};

export const markEmailParsed = (emailId: string) => {
  const db = getDb();
  db.prepare(MARK_EMAIL_PARSED).run(emailId);
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

export const getSelectedBrokerIds = (): string[] => {
  const db = getDb();
  const row = db.prepare(GET_SELECTED_BROKERS).get() as { value: string } | undefined;
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
  db.prepare(UPSERT_SETTING).run('selected_brokers', JSON.stringify(ids));
};

export const getBrokerCustomDomains = (): Record<string, string[]> => {
  const db = getDb();
  const row = db.prepare(GET_BROKER_CUSTOM_DOMAINS).get() as { value: string } | undefined;
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
  db.prepare(UPSERT_SETTING).run('broker_custom_domains', JSON.stringify(overrides));
};
