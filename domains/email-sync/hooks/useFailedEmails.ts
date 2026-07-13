'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RawEmail } from '@/domains/shared/types';

export const useFailedEmails = () => {
  const [failedEmails, setFailedEmails] = useState<RawEmail[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchFailedEmails = useCallback(async () => {
    try {
      const response = await fetch('/api/emails/failed');
      const data = await response.json();
      setFailedEmails(data.emails ?? []);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchFailedEmails();
  }, [fetchFailedEmails]);

  const retry = async (emailId: string) => {
    setRetryingId(emailId);
    try {
      await fetch(`/api/emails/${emailId}/retry`, { method: 'POST' });
      await fetchFailedEmails();
    } finally {
      setRetryingId(null);
    }
  };

  return {
    failedEmails,
    retryingId,
    retry,
    refetchFailedEmails: fetchFailedEmails,
  };
};
