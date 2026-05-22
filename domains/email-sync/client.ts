import { google } from 'googleapis';
import { getSetting } from '@/domains/shared/db';
import { GMAIL_SCOPES } from './constants';
import { buildSearchQuery, extractBody, getHeader } from './utils';
import type { FetchedEmail } from './types';
import type { Institution } from '@/domains/shared/types';

export const getOAuth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/gmail/callback`
  );

export const getAuthUrl = () => {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
  });
};

export const getRefreshToken = (): string | null =>
  getSetting('google_refresh_token') ?? process.env.GOOGLE_REFRESH_TOKEN ?? null;

export const getAuthenticatedClient = () => {
  const token = getRefreshToken();
  if (!token) throw new Error('Gmail not connected');
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: token });
  return oauth2Client;
};

const MAX_PAGES = 100;
const PAGE_SIZE_FULL = 500;
const PAGE_SIZE_RECENT = 100;

export type FetchOptions = {
  fullHistory?: boolean;
  onEmail?: (email: FetchedEmail) => void;
  onProgress?: (fetched: number) => void;
};

export const fetchBrokerEmails = async (
  institutions: Institution[],
  options: FetchOptions = {}
): Promise<FetchedEmail[]> => {
  const auth = getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const query = buildSearchQuery(institutions);

  const emails: FetchedEmail[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: options.fullHistory ? PAGE_SIZE_FULL : PAGE_SIZE_RECENT,
      ...(pageToken ? { pageToken } : {}),
    });

    const messageIds = listResponse.data.messages || [];

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
        const email: FetchedEmail = {
          id: msg.id!,
          sender,
          subject,
          body: body.substring(0, 10000),
          receivedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        };
        emails.push(email);
        options.onEmail?.(email);
      }
    }

    pageToken = listResponse.data.nextPageToken ?? undefined;
    pageCount++;

    if (options.onProgress) options.onProgress(emails.length);

  } while (options.fullHistory && pageToken && pageCount < MAX_PAGES);

  return emails;
};
