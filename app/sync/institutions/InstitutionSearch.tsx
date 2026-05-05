'use client';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Institution } from '@/domains/shared/types';
import { InstitutionChip } from './InstitutionChip';

type Suggestion = { name: string; domain: string; logo: string };

type Props = {
  institutions: Institution[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  suggestions: Suggestion[];
  searching: boolean;
  onAdd: (institution: Institution) => void;
  onRemove: (domain: string) => void;
  onUpdateDomain: (oldDomain: string, newDomain: string) => void;
};

export const InstitutionSearch = ({
  institutions,
  searchQuery,
  setSearchQuery,
  suggestions,
  searching,
  onAdd,
  onRemove,
  onUpdateDomain,
}: Props) => {
  const { t } = useTranslation('sync');
  const [manualDomain, setManualDomain] = useState('');
  const [showManual, setShowManual] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    onAdd({ name: suggestion.name, domain: suggestion.domain });
    setSearchQuery('');
  };

  const handleAddManual = () => {
    const domain = manualDomain.trim().toLowerCase();
    if (!domain) return;
    onAdd({ name: domain, domain });
    setManualDomain('');
    setShowManual(false);
  };

  const handleManualKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleAddManual();
  };

  const renderSuggestions = () => {
    if (searchQuery.trim().length < 2) return null;

    if (searching) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 p-3">
          <p className="text-gray-500 text-sm">{t('institutions.searching')}</p>
        </div>
      );
    }

    if (suggestions.length === 0) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 p-3">
          <p className="text-gray-500 text-sm">{t('institutions.noResults')}</p>
          <button
            onClick={() => { setShowManual(true); setSearchQuery(''); }}
            className="text-blue-400 text-sm mt-1 hover:underline"
          >
            {t('institutions.addManually')}
          </button>
        </div>
      );
    }

    return (
      <ul className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg z-10 overflow-hidden">
        {suggestions.map((suggestion) => (
          <li key={suggestion.domain}>
            <button
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition text-left"
            >
              {suggestion.logo && (
                <img src={suggestion.logo} alt="" className="w-5 h-5 rounded object-contain" />
              )}
              <span className="text-white text-sm">{suggestion.name}</span>
              <span className="text-gray-500 text-xs ml-auto">{suggestion.domain}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderManualInput = () => {
    if (!showManual) {
      return (
        <button
          onClick={() => setShowManual(true)}
          className="text-gray-500 text-xs hover:text-gray-300 transition"
        >
          {t('institutions.notFinding')}
        </button>
      );
    }

    return (
      <div className="flex gap-2">
        <input
          value={manualDomain}
          onChange={(event) => setManualDomain(event.target.value)}
          onKeyDown={handleManualKeyDown}
          placeholder={t('institutions.manualPlaceholder')}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-500"
        />
        <button
          onClick={handleAddManual}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition"
        >
          {t('institutions.add')}
        </button>
        <button
          onClick={() => { setShowManual(false); setManualDomain(''); }}
          className="text-gray-500 hover:text-gray-300 text-sm px-2"
        >
          {t('institutions.cancel')}
        </button>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">{t('institutions.title')}</h2>
      <p className="text-gray-500 text-sm mb-4">{t('institutions.subtitle')}</p>

      {institutions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {institutions.map((institution) => (
            <InstitutionChip
              key={institution.domain}
              institution={institution}
              onRemove={onRemove}
              onUpdateDomain={onUpdateDomain}
            />
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('institutions.searchPlaceholder')}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-gray-500"
        />
        {renderSuggestions()}
      </div>

      {renderManualInput()}
    </div>
  );
};
