'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useGmailSync } from '@/domains/email-sync/hooks/useGmailSync';
import { useInstitutionSettings } from '@/domains/email-sync/hooks/useInstitutionSettings';
import { useSyncJobs } from '@/domains/email-sync/hooks/useSyncJobs';
import { useFailedEmails } from '@/domains/email-sync/hooks/useFailedEmails';
import { GmailConnection } from './gmail/GmailConnection';
import { InstitutionSearch } from './institutions/InstitutionSearch';
import { FetchedEmailList } from './emails/FetchedEmailList';
import { FailedEmailList } from './emails/FailedEmailList';
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
    fetchDetail, parseDetail, parseProgress,
    handleFetch, handleParse, handleTokenReset, handleDbCleared, handleDisconnect,
  } = useSyncJobs({ status, syncError, handleSync, fetchStatus, t });
  const { failedEmails, retryingId, retry, refetchFailedEmails } = useFailedEmails();

  useEffect(() => {
    if (isConnected && institutions.length === 0 && !autoDetectDone) {
      runAutoDetect();
    }
  }, [isConnected]);

  useEffect(() => {
    if (parseResult) refetchFailedEmails();
  }, [parseResult, refetchFailedEmails]);

  const renderAutoDetectCallout = () => {
    if (detecting) {
      return <p className="text-gray-400 text-sm mb-3 italic">{t('sync.institutions.detecting')}</p>;
    }
    if (autoDetectDone && autoDetectedNames.length > 0) {
      return (
        <p className="text-indigo-600 text-sm mb-3">
          {t('sync.institutions.autoDetected', { names: autoDetectedNames.join(', ') })}
        </p>
      );
    }
    if (autoDetectDone && autoDetectedNames.length === 0) {
      return <p className="text-gray-400 text-sm mb-3">{t('sync.institutions.autoDetectedNone')}</p>;
    }
    return null;
  };

  const renderFailedEmails = () => {
    if (failedEmails.length === 0) return null;
    return (
      <div className="mb-6">
        <FailedEmailList emails={failedEmails} retryingId={retryingId} onRetry={retry} />
      </div>
    );
  };

  const renderGmailStep = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <GmailConnection status={status} onDisconnect={handleDisconnect} />
    </div>
  );

  const renderInstitutionsStep = () => {
    const locked = !isConnected;
    const lockClass = locked ? 'opacity-40 pointer-events-none' : '';
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 transition ${lockClass}`}>
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

  const renderFetchProgress = () => {
    if (!fetching || !fetchDetail) return null;
    return <p className="text-indigo-600 text-sm mt-3">{fetchDetail}</p>;
  };

  const renderFetchedEmails = () => {
    if (fetchedEmails.length === 0) return null;
    return (
      <div className="mt-4">
        <FetchedEmailList emails={fetchedEmails} />
      </div>
    );
  };

  const renderFetchStep = () => {
    const locked = !isConnected;
    const lockClass = locked ? 'opacity-40 pointer-events-none' : '';
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 transition ${lockClass}`}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">{t('sync.fetch.title')}</h2>
        <div>
          <button
            onClick={handleFetch}
            disabled={fetching || locked}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition"
          >
            {fetching ? t('sync.fetch.buttonSyncing') : t('sync.fetch.button')}
          </button>
          <p className="text-gray-400 text-xs mt-2">{t('sync.fetch.hint')}</p>
        </div>
        {renderFetchProgress()}
        {renderFetchedEmails()}
      </div>
    );
  };

  const renderParseProgress = () => {
    if (!parsing || !parseProgress) return null;
    const progressPct = Math.round((parseProgress.current / parseProgress.total) * 100);
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{parseDetail}</span>
          <span>{parseProgress.current}/{parseProgress.total}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    );
  };

  const renderParseResult = () => {
    if (!parseResult) return null;

    return (
      <div className="mt-4 space-y-2">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-indigo-600">
            {t('sync.parse.result.summary', { processed: parseResult.processed, transactions: parseResult.transactionsAdded })}
          </p>
        </div>
        {parseResult.patternSkipped > 0 && (
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-gray-500 text-sm">{t('sync.parse.result.patternSkipped', { count: parseResult.patternSkipped })}</p>
          </div>
        )}
        {parseResult.skipped.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-amber-600 text-sm mb-2">{t('sync.parse.result.skipped', { count: parseResult.skipped.length })}</p>
            <ul className="text-gray-500 text-sm space-y-1">
              {parseResult.skipped.map((skippedItem) => (
                <li key={skippedItem.emailId} className="truncate">
                  <span className="text-gray-400">{skippedItem.subject}</span> — {skippedItem.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        {parseResult.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm mb-2">{t('sync.parse.result.errors', { count: parseResult.errors.length })}</p>
            <ul className="text-red-500 text-sm space-y-1">
              {parseResult.errors.map((errorItem) => {
                const manualEntryHref = `/transactions/new?emailId=${encodeURIComponent(errorItem.emailId)}&subject=${encodeURIComponent(errorItem.subject)}`;
                return (
                  <li key={errorItem.emailId}>
                    <span className="text-red-400">{errorItem.subject}</span> — {errorItem.error}
                    <a href={manualEntryHref} className="text-indigo-600 hover:underline ml-2 text-xs">{t('sync.parse.result.addManually')}</a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderParseStep = () => {
    const locked = !isConnected || !hasSynced || unparsedCount === 0;
    const lockClass = locked ? 'opacity-40 pointer-events-none' : '';
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 transition ${lockClass}`}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">{t('sync.parse.title')}</h2>
        <button
          onClick={handleParse}
          disabled={parsing || locked}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition"
        >
          {parsing ? t('sync.parse.buttonParsing') : t('sync.parse.button', { count: unparsedCount })}
        </button>
        {renderParseProgress()}
        {!parsing && <p className="text-gray-400 text-xs mt-2">{t('sync.parse.progressHint')}</p>}
        {renderParseResult()}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('sync.title')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {renderFailedEmails()}
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
