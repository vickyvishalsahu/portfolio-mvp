'use client';

import type { SyncStatus, SyncResult } from '@/domains/email-sync/hooks/useGmailSync';

export interface ParseResult {
  processed: number;
  transactions_added: number;
  skipped: { email_id: string; subject: string; reason: string }[];
  errors: { email_id: string; subject: string; error: string }[];
}

type Props = {
  syncing: boolean;
  status: SyncStatus | null;
  selectedIds: string[];
  handleSync: () => void;
  parsing: boolean;
  unparsedCount: number;
  handleParse: () => void;
  syncResult: SyncResult | null;
  parseResult: ParseResult | null;
  error: string | null;
}

export const Pipeline = ({
  syncing, status, selectedIds, handleSync,
  parsing, unparsedCount, handleParse,
  syncResult, parseResult, error,
}: Props) => (
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
        <p className="text-green-400">Fetched {syncResult.fetched} emails, {syncResult.new} new</p>
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
              {parseResult.skipped.map((skippedItem) => (
                <li key={skippedItem.email_id} className="truncate">
                  <span className="text-gray-500">{skippedItem.subject}</span> — {skippedItem.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        {parseResult.errors.length > 0 && (
          <div className="bg-red-950 border border-red-800 rounded p-4">
            <p className="text-red-400 text-sm mb-2">Errors ({parseResult.errors.length}):</p>
            <ul className="text-red-300 text-sm space-y-1">
              {parseResult.errors.map((errorItem) => (
                <li key={errorItem.email_id}>
                  <span className="text-red-500">{errorItem.subject}</span> — {errorItem.error}
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
);
