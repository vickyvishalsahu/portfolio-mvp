'use client';

import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { BrokerDefinition } from '@/domains/shared/types';

export type BrokerCardProps = {
  broker: BrokerDefinition;
  selected: boolean;
  expanded: boolean;
  extras: string[];
  newDomainInput: string;
  setNewDomainInput: (value: string) => void;
  domainInputRef?: RefObject<HTMLInputElement | null>;
  onToggle: () => void;
  onExpand: () => void;
  onAddDomain: () => void;
  onRemoveDomain: (domain: string) => void;
}

export const BrokerCard = ({
  broker, selected, expanded, extras,
  newDomainInput, setNewDomainInput, domainInputRef,
  onToggle, onExpand, onAddDomain, onRemoveDomain,
}: BrokerCardProps) => {
  const { t } = useTranslation();

  const senderDomainsLabel = extras.length > 0
    ? t('sync.brokers.senderDomainsCustom', { count: extras.length })
    : t('sync.brokers.senderDomains');

  const cardClass = selected
    ? 'border-indigo-400 bg-indigo-50'
    : 'border-slate-200 bg-white';

  return (
    <div className={`rounded-xl border transition ${cardClass}`}>
      <button onClick={onToggle} className="w-full text-left p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center text-[10px] ${selected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
            {selected ? '✓' : ''}
          </span>
          <span className="text-sm font-medium text-gray-900 truncate">{broker.name}</span>
        </div>
        <div className="flex flex-wrap gap-1 pl-5">
          <span className="text-[10px] text-gray-400">{t(`sync.brokers.regions.${broker.region}`, { defaultValue: broker.region })}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">{broker.assetTypes.join(', ')}</span>
        </div>
      </button>

      {selected && (
        <div className="border-t border-indigo-100">
          <button
            onClick={onExpand}
            className="w-full text-left px-3 py-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center justify-between"
          >
            <span>{senderDomainsLabel}</span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div className="px-3 pb-3 space-y-2">
              <div className="flex flex-wrap gap-1">
                {broker.senderDomains.map((domain) => (
                  <span key={domain} className="text-[10px] bg-slate-100 text-gray-500 px-2 py-0.5 rounded-full">{domain}</span>
                ))}
                {extras.map((domain) => (
                  <span key={domain} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {domain}
                    <button onClick={() => onRemoveDomain(domain)} className="text-indigo-400 hover:text-indigo-700 ml-0.5 leading-none">×</button>
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
                  placeholder={t('sync.brokers.addDomainPlaceholder')}
                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                />
                <button onClick={onAddDomain} className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-lg">
                  {t('sync.brokers.add')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
