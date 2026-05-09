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

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async (): Promise<string | undefined> => {
    setError(null);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else return data.jobId as string;
    } catch {
      setError('Sync request failed');
    }
  };

  return { status, error, setError, fetchStatus, handleSync };
};
