'use client';

import { useState, useEffect } from 'react';

export interface SyncStatus {
  totalRaw: number;
  totalParsed: number;
  gmailConnected: boolean;
}

export const useGmailSync = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
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

  const handleSync = async (fullHistory = false): Promise<string | undefined> => {
    setError(null);
    const url = fullHistory ? '/api/gmail/sync?full=true' : '/api/gmail/sync';
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else return data.jobId as string;
    } catch {
      setError('Sync request failed');
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  return { status, error, setError, fetchStatus, handleSync };
};
