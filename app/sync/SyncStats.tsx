'use client';

import type { SyncStatus } from '@/domains/email-sync/hooks/useGmailSync';

type Props = {
  status: SyncStatus;
  unparsedCount: number;
}

export const SyncStats = ({ status, unparsedCount }: Props) => (
  <div className="grid grid-cols-3 gap-4">
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <p className="text-gray-400 text-sm">Raw Emails</p>
      <p className="text-2xl font-bold">{status.total_raw}</p>
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <p className="text-gray-400 text-sm">Parsed</p>
      <p className="text-2xl font-bold">{status.total_parsed}</p>
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <p className="text-gray-400 text-sm">Pending</p>
      <p className="text-2xl font-bold">{unparsedCount}</p>
    </div>
  </div>
);
