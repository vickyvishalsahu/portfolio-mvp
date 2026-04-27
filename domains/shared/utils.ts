import { BROKER_CATALOG } from './constants';
import type { BrokerDefinition } from './types';

export function getBrokersByIds(ids: string[]): BrokerDefinition[] {
  return ids
    .map((id) => BROKER_CATALOG.find((b) => b.id === id))
    .filter((b): b is BrokerDefinition => b !== undefined);
}

export function getAllSenderDomains(brokers: BrokerDefinition[]): string[] {
  return brokers.flatMap((b) => b.senderDomains);
}
