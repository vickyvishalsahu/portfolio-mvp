'use client';

import { useState } from 'react';

type ResetResult = {
  deleted: {
    raw_emails: number;
    transactions: number;
    price_cache: number;
    snapshots: number;
  };
};

export const DevResetPanel = () => {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NODE_ENV !== 'development') return null;

  const handleConfirmedReset = async () => {
    setResetting(true);
    setConfirming(false);
    try {
      const response = await fetch('/api/dev/reset', { method: 'POST' });
      const data = await response.json();
      if (response.ok) setResult(data);
      else setError(data.error);
    } catch {
      setError('Reset request failed');
    } finally {
      setResetting(false);
    }
  };

  const handleResetClick = () => {
    if (!confirming) {
      setConfirming(true);
      setResult(null);
      setError(null);
      return;
    }
    handleConfirmedReset();
  };

  const handleCancel = () => setConfirming(false);

  const renderButton = () => {
    if (resetting) return <span className="text-gray-500 text-sm">Resetting...</span>;

    if (confirming) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetClick}
            className="bg-red-700 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded transition"
          >
            Confirm reset
          </button>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-200 text-sm px-4 py-1.5 rounded border border-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleResetClick}
        className="bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300 text-sm px-4 py-1.5 rounded transition border border-gray-600 hover:border-red-800"
      >
        Reset DB
      </button>
    );
  };

  const renderResult = () => {
    if (error) return <p className="text-red-400 text-xs mt-2">{error}</p>;
    if (!result) return null;
    const { deleted } = result;
    return (
      <p className="text-green-600 text-xs mt-2">
        Cleared: {deleted.raw_emails} emails · {deleted.transactions} transactions · {deleted.price_cache} prices · {deleted.snapshots} snapshots
      </p>
    );
  };

  return (
    <div className="border border-dashed border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Dev tools</p>
      <div className="flex items-center gap-3">
        {renderButton()}
        {!confirming && (
          <span className="text-xs text-gray-600">
            Wipes emails, transactions, prices, snapshots. Keeps broker config.
          </span>
        )}
      </div>
      {renderResult()}
    </div>
  );
};
