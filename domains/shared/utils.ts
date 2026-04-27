import { BROKER_CATALOG } from './constants';
import type { BrokerDefinition } from './types';

export const getBrokersByIds = (ids: string[]): BrokerDefinition[] =>
  ids
    .map((id) => BROKER_CATALOG.find((broker) => broker.id === id))
    .filter((broker): broker is BrokerDefinition => broker !== undefined);

export const getAllSenderDomains = (brokers: BrokerDefinition[]): string[] =>
  brokers.flatMap((broker) => broker.senderDomains);
