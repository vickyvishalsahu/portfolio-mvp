import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const BROKER_SENDERS = [
  'scalable.capital',
  'zerodha.com',
  'camsonline.com',
  'binance.com',
  'coinbase.com',
];

const SUBJECT_KEYWORDS = [
  'confirmation',
  'contract note',
  'purchase',
  'SIP',
  'bought',
  'sold',
  'order',
  'execution',
  'transaction',
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/gmail/callback`
  );
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export function getAuthenticatedClient() {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

function buildSearchQuery(): string {
  const senderPart = BROKER_SENDERS.map(s => `from:${s}`).join(' OR ');
  const subjectPart = SUBJECT_KEYWORDS.map(k => `subject:${k}`).join(' OR ');
  return `(${senderPart}) (${subjectPart})`;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractBody(payload: any): string {
  // Simple text/plain body
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // text/html fallback
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart — recurse into parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }

  return '';
}

function getHeader(headers: any[], name: string): string {
  const header = headers?.find(
    (h: any) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || '';
}

export interface FetchedEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  received_at: string;
}

export async function fetchBrokerEmails(maxResults = 50): Promise<FetchedEmail[]> {
  const auth = getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const query = buildSearchQuery();

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  });

  const messageIds = listResponse.data.messages || [];
  const emails: FetchedEmail[] = [];

  for (const msg of messageIds) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full',
    });

    const headers = detail.data.payload?.headers || [];
    const sender = getHeader(headers, 'From');
    const subject = getHeader(headers, 'Subject');
    const date = getHeader(headers, 'Date');
    const body = extractBody(detail.data.payload);

    if (body) {
      emails.push({
        id: msg.id!,
        sender,
        subject,
        body: body.substring(0, 10000), // limit body size
        received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
    }
  }

  return emails;
}
