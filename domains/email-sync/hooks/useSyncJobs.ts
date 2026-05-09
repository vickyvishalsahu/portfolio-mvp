'use client';

import { useState, useEffect } from 'react';
import { SyncStatus } from './useGmailSync';
import { ParseResult, EmailListItem } from '@/domains/email-sync/types';

type UseSyncJobsParams = {
  status: SyncStatus | null;
  syncError: string | null;
  handleSync: () => Promise<string | undefined>;
  fetchStatus: () => Promise<void>;
  t: (key: string) => string;
};

export const useSyncJobs = ({ status, syncError, handleSync, fetchStatus, t }: UseSyncJobsParams) => {
  const [activeFetchJobId, setActiveFetchJobId] = useState<string | null>(null);
  const [activeParseJobId, setActiveParseJobId] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fetchedEmails, setFetchedEmails] = useState<EmailListItem[]>([]);

  const isConnected = status?.gmailConnected ?? false;
  const hasSynced = (status?.totalRaw ?? 0) > 0;
  const fetching = activeFetchJobId !== null;
  const parsing = activeParseJobId !== null;
  const unparsedCount = status ? status.totalRaw - status.totalParsed : 0;
  const error = syncError || parseError;

  const loadFetchedEmails = async () => {
    try {
      const response = await fetch('/api/emails');
      const data = await response.json();
      setFetchedEmails(data.emails ?? []);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    if (hasSynced) loadFetchedEmails();
  }, [hasSynced]);

  useEffect(() => {
    if (!activeFetchJobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/jobs');
        const jobs: { id: string; status: string }[] = await response.json();
        const job = jobs.find((jobItem) => jobItem.id === activeFetchJobId);
        if (job?.status === 'success' || job?.status === 'error') {
          await loadFetchedEmails();
          setActiveFetchJobId(null);
        }
      } catch {
        // non-fatal
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeFetchJobId]);

  useEffect(() => {
    if (!activeParseJobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/jobs');
        const jobs: { id: string; status: string; result?: ParseResult; detail: string }[] = await response.json();
        const job = jobs.find((jobItem) => jobItem.id === activeParseJobId);
        if (job?.status === 'success') {
          if (job.result) setParseResult(job.result as ParseResult);
          setActiveParseJobId(null);
        } else if (job?.status === 'error') {
          setParseError(job.detail);
          setActiveParseJobId(null);
        }
      } catch {
        // non-fatal
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeParseJobId]);

  const handleFetch = async () => {
    const jobId = await handleSync();
    if (jobId) setActiveFetchJobId(jobId);
  };

  const handleParse = async () => {
    setParseError(null);
    setParseResult(null);
    try {
      const response = await fetch('/api/parse', { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.jobId) setActiveParseJobId(data.jobId);
      else if (!response.ok) setParseError(data.error);
    } catch {
      setParseError(t('sync.parse.error'));
    }
  };

  const handleTokenReset = async () => {
    await fetchStatus();
  };

  const handleDbCleared = async () => {
    await fetchStatus();
    setFetchedEmails([]);
    setParseResult(null);
  };

  const handleDisconnect = async () => {
    await fetch('/api/gmail/disconnect', { method: 'POST' });
    await fetchStatus();
  };

  return {
    isConnected,
    hasSynced,
    fetching,
    parsing,
    unparsedCount,
    error,
    fetchedEmails,
    parseResult,
    parseError,
    handleFetch,
    handleParse,
    handleTokenReset,
    handleDbCleared,
    handleDisconnect,
  };
};
