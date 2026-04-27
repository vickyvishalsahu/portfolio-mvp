import { google } from 'googleapis';
import { GMAIL_SCOPES, DEFAULT_MAX_RESULTS } from './constants';
import { buildSearchQuery, extractBody, getHeader } from './utils';
import type { FetchedEmail } from './types';
import type { BrokerDefinition } from '@/domains/shared/types';

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
    scope: GMAIL_SCOPES,
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

export async function fetchBrokerEmails(
  brokers: BrokerDefinition[],
  maxResults = DEFAULT_MAX_RESULTS
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
