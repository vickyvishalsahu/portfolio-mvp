export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export const DEFAULT_MAX_RESULTS = 50;

export const INSERT_RAW_EMAIL = `
  INSERT OR IGNORE INTO raw_emails (id, sender, subject, body, received_at, parsed)
  VALUES (?, ?, ?, ?, ?, 0)
`;
export const GET_UNPARSED_EMAILS = 'SELECT * FROM raw_emails WHERE parsed = 0';
export const MARK_EMAIL_PARSED = 'UPDATE raw_emails SET parsed = 1 WHERE id = ?';
export const GET_EMAIL_COUNT = 'SELECT COUNT(*) as count FROM raw_emails';
export const GET_PARSED_EMAIL_COUNT = 'SELECT COUNT(*) as count FROM raw_emails WHERE parsed = 1';
export const GET_SELECTED_BROKERS = "SELECT value FROM settings WHERE key = 'selected_brokers'";
export const GET_BROKER_CUSTOM_DOMAINS = "SELECT value FROM settings WHERE key = 'broker_custom_domains'";
export const UPSERT_SETTING = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';
