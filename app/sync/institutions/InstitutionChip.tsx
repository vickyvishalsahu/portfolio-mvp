'use client';

import { useState, useRef, useEffect } from 'react';
import type { Institution } from '@/domains/shared/types';

type Props = {
  institution: Institution;
  onRemove: (domain: string) => void;
  onUpdateDomain: (oldDomain: string, newDomain: string) => void;
};

export const InstitutionChip = ({ institution, onRemove, onUpdateDomain }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draftDomain, setDraftDomain] = useState(institution.domain);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleDomainClick = () => {
    setDraftDomain(institution.domain);
    setEditing(true);
  };

  const handleCommit = () => {
    onUpdateDomain(institution.domain, draftDomain);
    setEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleCommit();
    if (event.key === 'Escape') {
      setDraftDomain(institution.domain);
      setEditing(false);
    }
  };

  const renderDomain = () => {
    if (editing) {
      return (
        <input
          ref={inputRef}
          value={draftDomain}
          onChange={(event) => setDraftDomain(event.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-b border-blue-400 text-blue-300 text-xs outline-none w-40"
        />
      );
    }

    return (
      <button
        onClick={handleDomainClick}
        className="text-gray-400 text-xs hover:text-blue-400 transition"
        title="Click to edit domain"
      >
        {institution.domain}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5">
      <span className="text-sm text-white">{institution.name}</span>
      <span className="text-gray-600">·</span>
      {renderDomain()}
      <button
        onClick={() => onRemove(institution.domain)}
        className="text-gray-600 hover:text-red-400 transition ml-1 text-xs leading-none"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
};
