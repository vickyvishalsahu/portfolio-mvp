'use client';

import type { RefObject } from 'react';
import type { BrokerDefinition } from '@/domains/shared/types';

const REGION_LABEL: Record<string, string> = {
  EU: 'Europe',
  IN: 'India',
  US: 'US',
  GLOBAL: 'Global',
};

export type BrokerCardProps = {
  broker: BrokerDefinition;
  selected: boolean;
  expanded: boolean;
  extras: string[];
  newDomainInput: string;
  setNewDomainInput: (value: string) => void;
  domainInputRef?: RefObject<HTMLInputElement>;
  onToggle: () => void;
  onExpand: () => void;
  onAddDomain: () => void;
  onRemoveDomain: (domain: string) => void;
}

export const BrokerCard = ({
  broker, selected, expanded, extras,
  newDomainInput, setNewDomainInput, domainInputRef,
  onToggle, onExpand, onAddDomain, onRemoveDomain,
}: BrokerCardProps) => (
  <div className={`rounded-lg border transition ${selected ? 'border-blue-500 bg-blue-950' : 'border-gray-700 bg-gray-800'}`}>
    <button onClick={onToggle} className="w-full text-left p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center text-[10px] ${selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-500'}`}>
          {selected ? '✓' : ''}
        </span>
        <span className="text-sm font-medium text-white truncate">{broker.name}</span>
      </div>
      <div className="flex flex-wrap gap-1 pl-5">
        <span className="text-[10px] text-gray-500">{REGION_LABEL[broker.region]}</span>
        <span className="text-[10px] text-gray-600">·</span>
        <span className="text-[10px] text-gray-500">{broker.assetTypes.join(', ')}</span>
      </div>
    </button>

    {selected && (
      <div className="border-t border-blue-800/40">
        <button
          onClick={onExpand}
          className="w-full text-left px-3 py-1.5 text-[10px] text-blue-400 hover:text-blue-300 flex items-center justify-between"
        >
          <span>Sender domains {extras.length > 0 ? `(+${extras.length} custom)` : ''}</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="px-3 pb-3 space-y-2">
            <div className="flex flex-wrap gap-1">
              {broker.senderDomains.map((domain) => (
                <span key={domain} className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded">{domain}</span>
              ))}
              {extras.map((domain) => (
                <span key={domain} className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                  {domain}
                  <button onClick={() => onRemoveDomain(domain)} className="text-blue-400 hover:text-white ml-0.5 leading-none">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                ref={domainInputRef}
                type="text"
                value={newDomainInput}
                onChange={(event) => setNewDomainInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && onAddDomain()}
                placeholder="e.g. noreply@angelone.in"
                className="flex-1 text-[11px] bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <button onClick={onAddDomain} className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
