'use client';

import { useState, useEffect } from 'react';

interface SyncStatus {
  total_raw: number;
  total_parsed: number;
  gmail_connected: boolean;
}

interface SyncResult {
  fetched: number;
  new: number;
  total_raw: number;
  total_parsed: number;
}

interface ParseResult {
  processed: number;
  transactions_added: number;
  skipped: { email_id: string; subject: string; reason: string }[];
  errors: { email_id: string; subject: string; error: string }[];
}

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/gmail/sync');
      const data = await res.json();
      if (res.ok) setStatus(data);
      else setError(data.error);
    } catch {
      setError('Failed to fetch status');
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        setStatus({ total_raw: data.total_raw, total_parsed: data.total_parsed, gmail_connected: true });
      } else {
        setError(data.error);
      }
    } catch {
      setError('Sync request failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleParse() {
    setParsing(true);
    setError(null);
    setParseResult(null);

    try {
      const res = await fetch('/api/parse', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setParseResult(data);
        fetchStatus();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Parse request failed');
    } finally {
      setParsing(false);
    }
  }

  const unparsedCount = status ? status.total_raw - status.total_parsed : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Email Sync</h1>

      {/* Connection Status */}
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
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-red-400">Not connected</span>
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

      {/* Sync + Parse Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Pipeline</h2>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing || !status?.gmail_connected}
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
                    <li key={e.email_id} className="truncate">
                      <span className="text-red-500">{e.subject}</span> — {e.error}
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
}
