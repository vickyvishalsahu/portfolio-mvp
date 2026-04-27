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

export const useGmailSync = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/gmail/sync');
      const data = await res.json();
      if (res.ok) setStatus(data);
      else setError(data.error);
    } catch {
      setError('Failed to fetch status');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
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
  };

  return { status, syncing, syncResult, error, setError, fetchStatus, handleSync };
};
