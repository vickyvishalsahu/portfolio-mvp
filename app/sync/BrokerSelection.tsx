'use client';

import type { RefObject } from 'react';
import type { BrokerDefinition } from '@/domains/shared/types';
import { BrokerCard } from './BrokerCard';

type Props = {
  catalog: BrokerDefinition[];
  selectedIds: string[];
  customDomains: Record<string, string[]>;
  expandedBroker: string | null;
  savingBrokers: boolean;
  newDomainInput: string;
  setNewDomainInput: (value: string) => void;
  domainInputRef: RefObject<HTMLInputElement>;
  handleToggleBroker: (id: string) => void;
  handleExpandWithFocus: (id: string) => void;
  handleAddDomain: (brokerId: string) => void;
  handleRemoveCustomDomain: (brokerId: string, domain: string) => void;
}

export const BrokerSelection = ({
  catalog, selectedIds, customDomains, expandedBroker, savingBrokers,
  newDomainInput, setNewDomainInput, domainInputRef,
  handleToggleBroker, handleExpandWithFocus, handleAddDomain, handleRemoveCustomDomain,
}: Props) => {
  const renderCatalog = () => {
    if (catalog.length === 0) return <p className="text-gray-500 text-sm">Loading...</p>;

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {catalog.map((broker) => {
            const selected = selectedIds.includes(broker.id);
            const expanded = expandedBroker === broker.id;
            const extras = customDomains[broker.id] ?? [];
            const activeRef = expanded ? domainInputRef : undefined;

            return (
              <BrokerCard
                key={broker.id}
                broker={broker}
                selected={selected}
                expanded={expanded}
                extras={extras}
                newDomainInput={newDomainInput}
                setNewDomainInput={setNewDomainInput}
                domainInputRef={activeRef}
                onToggle={() => handleToggleBroker(broker.id)}
                onExpand={() => handleExpandWithFocus(broker.id)}
                onAddDomain={() => handleAddDomain(broker.id)}
                onRemoveDomain={(domain) => handleRemoveCustomDomain(broker.id, domain)}
              />
            );
          })}
        </div>
        <p className="text-xs text-gray-500">
          Only emails from selected brokers will be fetched. Expand a card to add custom sender domains.
        </p>
      </>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Brokers</h2>
        {savingBrokers && <span className="text-xs text-gray-500">Saving...</span>}
      </div>
      {renderCatalog()}
    </div>
  );
};
