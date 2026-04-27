'use client';

import { useState, useRef } from 'react';
import { useGmailSync } from '@/domains/email-sync/hooks/useGmailSync';
import { useBrokerSettings } from '@/domains/email-sync/hooks/useBrokerSettings';
import { BrokerSelection } from './broker/BrokerSelection';
import { GmailConnection } from './gmail/GmailConnection';
import { Pipeline } from './Pipeline';
import type { ParseResult } from './Pipeline';
import { SyncStats } from './SyncStats';

const SyncPage = () => {
  const {
    status, syncing, syncResult,
    error: syncError, handleSync,
  } = useGmailSync();

  const {
    catalog, selectedIds, customDomains, expandedBroker, savingBrokers,
    newDomainInput, setNewDomainInput,
    handleToggleBroker, handleExpandBroker, handleAddDomain, handleRemoveCustomDomain,
  } = useBrokerSettings();

  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const domainInputRef = useRef<HTMLInputElement>(null);

  const handleExpandWithFocus = (id: string) => {
    handleExpandBroker(id);
    setTimeout(() => domainInputRef.current?.focus(), 50);
  };

  const handleParse = async () => {
    setParsing(true);
    setParseError(null);
    setParseResult(null);
    try {
      const res = await fetch('/api/parse', { method: 'POST' });
      const data = await res.json();
      if (res.ok) setParseResult(data);
      else setParseError(data.error);
    } catch {
      setParseError('Parse request failed');
    } finally {
      setParsing(false);
    }
  };

  const unparsedCount = status ? status.total_raw - status.total_parsed : 0;
  const selectedNames = catalog.filter((broker) => selectedIds.includes(broker.id)).map((broker) => broker.name);
  const error = syncError || parseError;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Email Sync</h1>
      <BrokerSelection
        catalog={catalog}
        selectedIds={selectedIds}
        customDomains={customDomains}
        expandedBroker={expandedBroker}
        savingBrokers={savingBrokers}
        newDomainInput={newDomainInput}
        setNewDomainInput={setNewDomainInput}
        domainInputRef={domainInputRef}
        handleToggleBroker={handleToggleBroker}
        handleExpandWithFocus={handleExpandWithFocus}
        handleAddDomain={handleAddDomain}
        handleRemoveCustomDomain={handleRemoveCustomDomain}
      />
      <GmailConnection status={status} selectedNames={selectedNames} />
      <Pipeline
        syncing={syncing}
        status={status}
        selectedIds={selectedIds}
        handleSync={handleSync}
        parsing={parsing}
        unparsedCount={unparsedCount}
        handleParse={handleParse}
        syncResult={syncResult}
        parseResult={parseResult}
        error={error}
      />
      {status && <SyncStats status={status} unparsedCount={unparsedCount} />}
    </div>
  );
};

export default SyncPage;
