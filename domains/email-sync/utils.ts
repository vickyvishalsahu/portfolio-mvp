import type { Institution } from '@/domains/shared/types';

export const buildSearchQuery = (institutions: Institution[]): string =>
  institutions.map((institution) => `from:${institution.domain}`).join(' OR ');

export const decodeBase64Url = (data: string): string =>
  Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');

export const extractBody = (payload: any): string => {
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
};

export const getHeader = (headers: any[], name: string): string => {
  const header = headers?.find((headerItem: any) => headerItem.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
};
