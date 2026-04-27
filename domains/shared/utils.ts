import { BROKER_CATALOG } from './constants';
import type { BrokerDefinition } from './types';

export const getBrokersByIds = (ids: string[]): BrokerDefinition[] =>
  ids
    .map((id) => BROKER_CATALOG.find((b) => b.id === id))
    .filter((b): b is BrokerDefinition => b !== undefined);

export const getAllSenderDomains = (brokers: BrokerDefinition[]): string[] =>
  brokers.flatMap((b) => b.senderDomains);
