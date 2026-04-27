'use client';

import type { SyncStatus } from '@/domains/email-sync/hooks/useGmailSync';

type Props = {
  status: SyncStatus | null;
  selectedNames: string[];
};

export const GmailConnection = ({ status, selectedNames }: Props) => {
  const renderBrokerNotice = () => {
    if (selectedNames.length > 0) {
      return <> Only emails from <span className="text-white">{selectedNames.join(', ')}</span> will be stored locally.</>;
    }
    return <> Select at least one broker above before connecting.</>;
  };

  const renderStatus = () => {
    if (status === null) return <p className="text-gray-500">Loading...</p>;

    if (status.gmail_connected) {
      return (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-green-400">Connected</span>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-red-400">Not connected</span>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4 text-sm text-gray-400">
          <p className="mb-1 font-medium text-gray-300">Before you connect</p>
          <p>
            We request <span className="text-white">read-only</span> Gmail access to find broker confirmation emails.
            {renderBrokerNotice()}{' '}
            No other emails are read, stored, or transmitted.
          </p>
        </div>
        <a
          href="/api/gmail/auth"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Connect Gmail
        </a>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Gmail Connection</h2>
      {renderStatus()}
    </div>
  );
};
