'use client';

import type { SyncStatus } from '@/domains/email-sync/hooks/useGmailSync';
import { GmailLoading } from './GmailLoading';
import { GmailConnected } from './GmailConnected';
import { GmailDisconnected } from './GmailDisconnected';

type Props = {
  status: SyncStatus | null;
  selectedNames: string[];
};

export const GmailConnection = ({ status, selectedNames }: Props) => {
  const renderStatus = () => {
    if (status === null) return <GmailLoading />;
    if (status.gmail_connected) return <GmailConnected />;
    return <GmailDisconnected selectedNames={selectedNames} />;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Gmail Connection</h2>
      {renderStatus()}
    </div>
  );
};
