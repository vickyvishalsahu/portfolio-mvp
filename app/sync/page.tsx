'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useGmailSync } from '@/domains/email-sync/hooks/useGmailSync';
import { useInstitutionSettings } from '@/domains/email-sync/hooks/useInstitutionSettings';
import { useSyncJobs } from '@/domains/email-sync/hooks/useSyncJobs';
import { GmailConnection } from './gmail/GmailConnection';
import { InstitutionSearch } from './institutions/InstitutionSearch';
import { FetchedEmailList } from './emails/FetchedEmailList';
import { SyncStats } from './SyncStats';
import { DangerZone } from './DangerZone';

const SyncPage = () => {
  const { t } = useTranslation();
  const { status, error: syncError, handleSync, fetchStatus } = useGmailSync();
  const {
    institutions, searchQuery, setSearchQuery, suggestions, searching,
    detecting, autoDetectedNames, autoDetectDone, runAutoDetect,
    addInstitution, removeInstitution, updateDomain,
  } = useInstitutionSettings();
  const {
    isConnected, hasSynced, fetching, parsing, unparsedCount, error,
    fetchedEmails, parseResult,
    handleFetch, handleFullHistoryFetch, handleParse, handleTokenReset, handleDbCleared, handleDisconnect,
  } = useSyncJobs({ status, syncError, handleSync, fetchStatus, t });

  useEffect(() => {
    if (isConnected && institutions.length === 0 && !autoDetectDone) {
      runAutoDetect();
    }
  }, [isConnected]);

  const renderAutoDetectCallout = () => {
    if (detecting) {
      return (
        <p className="text-gray-400 text-sm mb-3 italic">{t('sync.institutions.detecting')}</p>
      );
    }
    if (autoDetectDone && autoDetectedNames.length > 0) {
      return (
        <p className="text-blue-400 text-sm mb-3">
          {t('sync.institutions.autoDetected', { names: autoDetectedNames.join(', ') })}
        </p>
      );
    }
    if (autoDetectDone && autoDetectedNames.length === 0) {
      return (
        <p className="text-gray-500 text-sm mb-3">{t('sync.institutions.autoDetectedNone')}</p>
      );
    }
    return null;
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
        {renderAutoDetectCallout()}
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
    const locked = !isConnected;
    return (
      <div className={`bg-gray-900 border rounded-lg p-6 mb-6 transition ${locked ? 'border-gray-800 opacity-40 pointer-events-none' : 'border-gray-800'}`}>
        <h2 className="text-lg font-semibold mb-4">{t('sync.fetch.title')}</h2>
        <div className="flex flex-wrap gap-3 items-start">
          <div>
            <button
              onClick={handleFetch}
              disabled={fetching || locked}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded transition"
            >
              {fetching ? t('sync.fetch.buttonFetching') : t('sync.fetch.button')}
            </button>
            <p className="text-gray-500 text-xs mt-2">{t('sync.fetch.progressHint')}</p>
          </div>
          <div>
            <button
              onClick={handleFullHistoryFetch}
              disabled={fetching || locked}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 py-2 rounded transition"
            >
              {fetching ? t('sync.fetch.buttonFetchingHistory') : t('sync.fetch.buttonFullHistory')}
            </button>
            <p className="text-gray-500 text-xs mt-2">{t('sync.fetch.fullHistoryHint')}</p>
          </div>
        </div>
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
        <h2 className="text-lg font-semibold mb-4">{t('sync.parse.title')}</h2>
        <button
          onClick={handleParse}
          disabled={parsing || locked}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded transition"
        >
          {parsing ? t('sync.parse.buttonParsing') : t('sync.parse.button', { count: unparsedCount })}
        </button>
        <p className="text-gray-500 text-xs mt-2">{t('sync.parse.progressHint')}</p>
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
            {t('sync.parse.result.summary', { processed: parseResult.processed, transactions: parseResult.transactionsAdded })}
          </p>
        </div>
        {parseResult.skipped.length > 0 && (
          <div className="bg-gray-800 rounded p-4">
            <p className="text-yellow-400 text-sm mb-2">{t('sync.parse.result.skipped', { count: parseResult.skipped.length })}</p>
            <ul className="text-gray-400 text-sm space-y-1">
              {parseResult.skipped.map((skippedItem) => (
                <li key={skippedItem.emailId} className="truncate">
                  <span className="text-gray-500">{skippedItem.subject}</span> — {skippedItem.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        {parseResult.errors.length > 0 && (
          <div className="bg-red-950 border border-red-800 rounded p-4">
            <p className="text-red-400 text-sm mb-2">{t('sync.parse.result.errors', { count: parseResult.errors.length })}</p>
            <ul className="text-red-300 text-sm space-y-1">
              {parseResult.errors.map((errorItem) => (
                <li key={errorItem.emailId}>
                  <span className="text-red-500">{errorItem.subject}</span> — {errorItem.error}
                  <a href="/transactions/new" className="text-blue-400 hover:underline ml-2 text-xs">{t('sync.parse.result.addManually')}</a>
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
      <h1 className="text-3xl font-bold mb-6">{t('sync.title')}</h1>

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
