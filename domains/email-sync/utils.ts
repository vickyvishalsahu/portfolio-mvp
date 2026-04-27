import { GLOBAL_SUBJECT_KEYWORDS } from './constants';
import type { BrokerDefinition } from '@/domains/shared/types';

export const getGmailSearchTerms = (brokers: BrokerDefinition[]): string[] =>
  brokers.flatMap((b) => b.gmailSearchTerms ?? b.senderDomains);

export const getAllSubjectKeywords = (brokers: BrokerDefinition[]): string[] => {
  const brokerKeywords = brokers.flatMap((b) => b.subjectKeywords ?? []);
  return [...new Set([...GLOBAL_SUBJECT_KEYWORDS, ...brokerKeywords])];
};

export const buildSearchQuery = (brokers: BrokerDefinition[]): string => {
  const senderPart = getGmailSearchTerms(brokers).map((s) => `from:${s}`).join(' OR ');
  const subjectPart = getAllSubjectKeywords(brokers).map((k) => `subject:${k}`).join(' OR ');
  return `(${senderPart}) (${subjectPart})`;
};

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
  const header = headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
};

export const mergeCustomDomains = (
  brokers: BrokerDefinition[],
  customDomains: Record<string, string[]>
): BrokerDefinition[] =>
  brokers.map((b) => {
    const extras = customDomains[b.id] ?? [];
    if (extras.length === 0) return b;
    return {
      ...b,
      senderDomains: [...new Set([...b.senderDomains, ...extras])],
      gmailSearchTerms: [...new Set([...(b.gmailSearchTerms ?? b.senderDomains), ...extras])],
    };
  });
