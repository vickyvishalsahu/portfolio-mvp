'use client';

import { useState, useRef } from 'react';
import { useGmailSync } from '@/domains/email-sync/hooks/useGmailSync';
import { useBrokerSettings } from '@/domains/email-sync/hooks/useBrokerSettings';

interface ParseResult {
  processed: number;
  transactions_added: number;
  skipped: { email_id: string; subject: string; reason: string }[];
  errors: { email_id: string; subject: string; error: string }[];
}

const REGION_LABEL: Record<string, string> = {
  EU: 'Europe',
  IN: 'India',
  US: 'US',
  GLOBAL: 'Global',
};

const SyncPage = () => {
  const {
    status,
    syncing,
    syncResult,
    error: syncError,
    handleSync,
  } = useGmailSync();

  const {
    catalog,
    selectedIds,
    customDomains,
    expandedBroker,
    savingBrokers,
    newDomainInput,
    setNewDomainInput,
    handleToggleBroker,
    handleExpandBroker,
    handleAddDomain,
    handleRemoveCustomDomain,
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
      if (res.ok) {
        setParseResult(data);
      } else {
        setParseError(data.error);
      }
    } catch {
      setParseError('Parse request failed');
    } finally {
      setParsing(false);
    }
  };

  const unparsedCount = status ? status.total_raw - status.total_parsed : 0;
  const selectedNames = catalog.filter((b) => selectedIds.includes(b.id)).map((b) => b.name);
  const error = syncError || parseError;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Email Sync</h1>

      {/* Broker Selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Brokers</h2>
          {savingBrokers && <span className="text-xs text-gray-500">Saving...</span>}
        </div>
        {catalog.length === 0 ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {catalog.map((broker) => {
                const selected = selectedIds.includes(broker.id);
                const expanded = expandedBroker === broker.id;
                const extras = customDomains[broker.id] ?? [];

                return (
                  <div
                    key={broker.id}
                    className={`rounded-lg border transition ${
                      selected
                        ? 'border-blue-500 bg-blue-950'
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    {/* Card header — toggle selection */}
                    <button
                      onClick={() => handleToggleBroker(broker.id)}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center text-[10px] ${
                            selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-500'
                          }`}
                        >
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

                    {/* Expand/collapse domain editor — only for selected brokers */}
                    {selected && (
                      <div className="border-t border-blue-800/40">
                        <button
                          onClick={() => handleExpandWithFocus(broker.id)}
                          className="w-full text-left px-3 py-1.5 text-[10px] text-blue-400 hover:text-blue-300 flex items-center justify-between"
                        >
                          <span>Sender domains {extras.length > 0 ? `(+${extras.length} custom)` : ''}</span>
                          <span>{expanded ? '▲' : '▼'}</span>
                        </button>

                        {expanded && (
                          <div className="px-3 pb-3 space-y-2">
                            {/* Catalog domains — read-only */}
                            <div className="flex flex-wrap gap-1">
                              {broker.senderDomains.map((d) => (
                                <span
                                  key={d}
                                  className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded"
                                >
                                  {d}
                                </span>
                              ))}
                              {/* Custom domains — deletable */}
                              {extras.map((d) => (
                                <span
                                  key={d}
                                  className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded flex items-center gap-1"
                                >
                                  {d}
                                  <button
                                    onClick={() => handleRemoveCustomDomain(broker.id, d)}
                                    className="text-blue-400 hover:text-white ml-0.5 leading-none"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            {/* Add custom domain */}
                            <div className="flex gap-1">
                              <input
                                ref={expandedBroker === broker.id ? domainInputRef : null}
                                type="text"
                                value={newDomainInput}
                                onChange={(e) => setNewDomainInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain(broker.id)}
                                placeholder="e.g. noreply@angelone.in"
                                className="flex-1 text-[11px] bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => handleAddDomain(broker.id)}
                                className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">
              Only emails from selected brokers will be fetched. Expand a card to add custom sender domains.
            </p>
          </>
        )}
      </div>

      {/* Gmail Connection */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Gmail Connection</h2>
        {status === null ? (
          <p className="text-gray-500">Loading...</p>
        ) : status.gmail_connected ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-green-400">Connected</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-red-400">Not connected</span>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4 text-sm text-gray-400">
              <p className="mb-1 font-medium text-gray-300">Before you connect</p>
              <p>
                We request <span className="text-white">read-only</span> Gmail access to find broker confirmation emails.
                {selectedNames.length > 0 ? (
                  <> Only emails from <span className="text-white">{selectedNames.join(', ')}</span> will be stored locally.</>
                ) : (
                  <> Select at least one broker above before connecting.</>
                )}{' '}
                No other emails are read, stored, or transmitted.
              </p>
            </div>
            <a
              href="/api/gmail/auth"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Connect Gmail
            </a>
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Pipeline</h2>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing || !status?.gmail_connected || selectedIds.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded transition"
          >
            {syncing ? 'Fetching...' : '1. Fetch Emails'}
          </button>
          <button
            onClick={handleParse}
            disabled={parsing || unparsedCount === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded transition"
          >
            {parsing ? 'Parsing...' : `2. Parse Emails (${unparsedCount} pending)`}
          </button>
        </div>
        {selectedIds.length === 0 && status?.gmail_connected && (
          <p className="text-xs text-yellow-500 mt-3">Select at least one broker to enable fetching.</p>
        )}

        {syncResult && (
          <div className="mt-4 bg-gray-800 rounded p-4">
            <p className="text-green-400">
              Fetched {syncResult.fetched} emails, {syncResult.new} new
            </p>
          </div>
        )}

        {parseResult && (
          <div className="mt-4 space-y-2">
            <div className="bg-gray-800 rounded p-4">
              <p className="text-purple-400">
                Processed {parseResult.processed} emails, added {parseResult.transactions_added} transactions
              </p>
            </div>
            {parseResult.skipped.length > 0 && (
              <div className="bg-gray-800 rounded p-4">
                <p className="text-yellow-400 text-sm mb-2">Skipped ({parseResult.skipped.length}):</p>
                <ul className="text-gray-400 text-sm space-y-1">
                  {parseResult.skipped.map((s) => (
                    <li key={s.email_id} className="truncate">
                      <span className="text-gray-500">{s.subject}</span> — {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {parseResult.errors.length > 0 && (
              <div className="bg-red-950 border border-red-800 rounded p-4">
                <p className="text-red-400 text-sm mb-2">Errors ({parseResult.errors.length}):</p>
                <ul className="text-red-300 text-sm space-y-1">
                  {parseResult.errors.map((e) => (
                    <li key={e.email_id}>
                      <span className="text-red-500">{e.subject}</span> — {e.error}
                      <a href="/transactions/new" className="text-blue-400 hover:underline ml-2 text-xs">Add manually →</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-950 border border-red-800 rounded p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Raw Emails</p>
            <p className="text-2xl font-bold">{status.total_raw}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Parsed</p>
            <p className="text-2xl font-bold">{status.total_parsed}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-2xl font-bold">{unparsedCount}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncPage;
