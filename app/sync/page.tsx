'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGmailSync } from '@/domains/email-sync/hooks/useGmailSync';
import { useInstitutionSettings } from '@/domains/email-sync/hooks/useInstitutionSettings';
import { GmailConnection } from './gmail/GmailConnection';
import { InstitutionSearch } from './institutions/InstitutionSearch';
import { FetchedEmailList } from './emails/FetchedEmailList';
import { SyncStats } from './SyncStats';
import { DangerZone } from './DangerZone';

type ParseResult = {
  processed: number;
  transactions_added: number;
  skipped: { email_id: string; subject: string; reason: string }[];
  errors: { email_id: string; subject: string; error: string }[];
};

type FetchedEmail = {
  id: string;
  sender: string;
  subject: string;
  received_at: string;
  parsed: number;
};

const SyncPage = () => {
  const { t } = useTranslation('sync');
  const { status, error: syncError, handleSync, fetchStatus } = useGmailSync();
  const {
    institutions, searchQuery, setSearchQuery, suggestions, searching,
    addInstitution, removeInstitution, updateDomain,
  } = useInstitutionSettings();

  const [activeFetchJobId, setActiveFetchJobId] = useState<string | null>(null);
  const [activeParseJobId, setActiveParseJobId] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmail[]>([]);

  const isConnected = status?.gmail_connected ?? false;
  const hasInstitutions = institutions.length > 0;
  const hasSynced = (status?.total_raw ?? 0) > 0;
  const fetching = activeFetchJobId !== null;
  const parsing = activeParseJobId !== null;
  const unparsedCount = status ? status.total_raw - status.total_parsed : 0;
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
      setParseError(t('parse.error'));
    }
  };

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

  const renderGmailStep = () => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <GmailConnection
        status={status}
        onDisconnect={handleDisconnect}
      />
    </div>
  );

  const renderInstitutionsStep = () => {
    const locked = !isConnected;
    return (
      <div className={`bg-gray-900 border rounded-lg p-6 mb-6 transition ${locked ? 'border-gray-800 opacity-40 pointer-events-none' : 'border-gray-800'}`}>
        <InstitutionSearch
          institutions={institutions}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestions={suggestions}
          searching={searching}
          onAdd={addInstitution}
          onRemove={removeInstitution}
          onUpdateDomain={updateDomain}
        />
      </div>
    );
  };

  const renderFetchStep = () => {
    const locked = !isConnected || !hasInstitutions;
    return (
      <div className={`bg-gray-900 border rounded-lg p-6 mb-6 transition ${locked ? 'border-gray-800 opacity-40 pointer-events-none' : 'border-gray-800'}`}>
        <h2 className="text-lg font-semibold mb-4">{t('fetch.title')}</h2>
        <button
          onClick={handleFetch}
          disabled={fetching || locked}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded transition"
        >
          {fetching ? t('fetch.buttonFetching') : t('fetch.button')}
        </button>
        <p className="text-gray-500 text-xs mt-2">{t('fetch.progressHint')}</p>
        {fetchedEmails.length > 0 && (
          <div className="mt-4">
            <FetchedEmailList emails={fetchedEmails} />
          </div>
        )}
      </div>
    );
  };

  const renderParseStep = () => {
    const locked = !isConnected || !hasSynced || unparsedCount === 0;
    return (
      <div className={`bg-gray-900 border rounded-lg p-6 mb-6 transition ${locked ? 'border-gray-800 opacity-40 pointer-events-none' : 'border-gray-800'}`}>
        <h2 className="text-lg font-semibold mb-4">{t('parse.title')}</h2>
        <button
          onClick={handleParse}
          disabled={parsing || locked}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded transition"
        >
          {parsing ? t('parse.buttonParsing') : t('parse.button', { count: unparsedCount })}
        </button>
        <p className="text-gray-500 text-xs mt-2">{t('parse.progressHint')}</p>
        {renderParseResult()}
      </div>
    );
  };

  const renderParseResult = () => {
    if (!parseResult) return null;

    return (
      <div className="mt-4 space-y-2">
        <div className="bg-gray-800 rounded p-4">
          <p className="text-purple-400">
            {t('parse.result.summary', { processed: parseResult.processed, transactions: parseResult.transactions_added })}
          </p>
        </div>
        {parseResult.skipped.length > 0 && (
          <div className="bg-gray-800 rounded p-4">
            <p className="text-yellow-400 text-sm mb-2">{t('parse.result.skipped', { count: parseResult.skipped.length })}</p>
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
            <p className="text-red-400 text-sm mb-2">{t('parse.result.errors', { count: parseResult.errors.length })}</p>
            <ul className="text-red-300 text-sm space-y-1">
              {parseResult.errors.map((errorItem) => (
                <li key={errorItem.email_id}>
                  <span className="text-red-500">{errorItem.subject}</span> — {errorItem.error}
                  <a href="/transactions/new" className="text-blue-400 hover:underline ml-2 text-xs">{t('parse.result.addManually')}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {renderGmailStep()}
      {renderInstitutionsStep()}
      {renderFetchStep()}
      {renderParseStep()}

      {status && (
        <SyncStats status={status} unparsedCount={unparsedCount} />
      )}

      <DangerZone onTokenReset={handleTokenReset} onDbCleared={handleDbCleared} />
    </div>
  );
};

export default SyncPage;
