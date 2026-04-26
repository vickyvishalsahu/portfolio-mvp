import { google } from 'googleapis';
import { getGmailSearchTerms, getAllSubjectKeywords } from './brokers';
import type { BrokerDefinition } from './brokers';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

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

function buildSearchQuery(brokers: BrokerDefinition[]): string {
  const senderPart = getGmailSearchTerms(brokers).map(s => `from:${s}`).join(' OR ');
  const subjectPart = getAllSubjectKeywords(brokers).map(k => `subject:${k}`).join(' OR ');
  return `(${senderPart}) (${subjectPart})`;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractBody(payload: any): string {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }
  return '';
}

function getHeader(headers: any[], name: string): string {
  const header = headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

export interface FetchedEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  received_at: string;
}

export async function fetchBrokerEmails(
  brokers: BrokerDefinition[],
  maxResults = 50
): Promise<FetchedEmail[]> {
  if (brokers.length === 0) return [];

  const auth = getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: buildSearchQuery(brokers),
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
        body: body.substring(0, 10000),
        received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
    }
  }

  return emails;
}
