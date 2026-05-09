'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Action = 'token' | 'db' | null;

type Props = {
  onTokenReset: () => void;
  onDbCleared: () => void;
};

export const DangerZone = ({ onTokenReset, onDbCleared }: Props) => {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState<Action>(null);
  const [loading, setLoading] = useState<Action>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetToken = async () => {
    setLoading('token');
    setError(null);
    try {
      const response = await fetch('/api/gmail/disconnect', { method: 'POST' });
      if (response.ok) onTokenReset();
      else setError(t('sync.danger.token.error'));
    } catch {
      setError(t('sync.danger.requestFailed'));
    } finally {
      setLoading(null);
      setConfirming(null);
    }
  };

  const handleClearDb = async () => {
    setLoading('db');
    setError(null);
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) onDbCleared();
      else setError(t('sync.danger.db.error'));
    } catch {
      setError(t('sync.danger.requestFailed'));
    } finally {
      setLoading(null);
      setConfirming(null);
    }
  };

  const renderTokenAction = () => {
    if (loading === 'token') return <span className="text-gray-500 text-sm">{t('sync.danger.token.disconnecting')}</span>;

    if (confirming === 'token') {
      return (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{t('sync.danger.token.confirmText')}</p>
          <div className="flex gap-2">
            <button
              onClick={handleResetToken}
              className="bg-red-700 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded transition"
            >
              {t('sync.danger.token.confirm')}
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="text-gray-400 hover:text-gray-200 text-sm px-4 py-1.5 rounded border border-gray-700 transition"
            >
              {t('sync.danger.token.cancel')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          setConfirming('token');
          setError(null);
        }}
        className="bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300 text-sm px-4 py-1.5 rounded transition border border-gray-600 hover:border-red-800"
      >
        {t('sync.danger.token.button')}
      </button>
    );
  };

  const renderDbAction = () => {
    if (loading === 'db') return <span className="text-gray-500 text-sm">{t('sync.danger.db.clearing')}</span>;

    if (confirming === 'db') {
      return (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{t('sync.danger.db.confirmText')}</p>
          <div className="flex gap-2">
            <button
              onClick={handleClearDb}
              className="bg-red-700 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded transition"
            >
              {t('sync.danger.db.confirm')}
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="text-gray-400 hover:text-gray-200 text-sm px-4 py-1.5 rounded border border-gray-700 transition"
            >
              {t('sync.danger.db.cancel')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          setConfirming('db');
          setError(null);
        }}
        className="bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300 text-sm px-4 py-1.5 rounded transition border border-gray-600 hover:border-red-800"
      >
        {t('sync.danger.db.button')}
      </button>
    );
  };

  return (
    <div className="border border-dashed border-gray-700 rounded-lg p-4 mt-6">
      <p className="text-xs text-gray-600 mb-3 uppercase tracking-wide">{t('sync.danger.zone')}</p>
      <div className="flex flex-col gap-4">
        <div>{renderTokenAction()}</div>
        <div>{renderDbAction()}</div>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
};
