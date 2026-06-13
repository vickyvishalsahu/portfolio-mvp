'use client';

import { useTranslation } from 'react-i18next';
import type { SyncStatus } from '@/domains/email-sync/hooks/useGmailSync';

type Props = {
  status: SyncStatus;
  unparsedCount: number;
}

export const SyncStats = ({ status, unparsedCount }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-gray-500 text-sm mb-3">{t('sync.stats.rawEmails')}</p>
        <p className="text-2xl font-bold text-gray-900">{status.totalRaw}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-gray-500 text-sm mb-3">{t('sync.stats.parsed')}</p>
        <p className="text-2xl font-bold text-gray-900">{status.totalParsed}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-gray-500 text-sm mb-3">{t('sync.stats.pending')}</p>
        <p className="text-2xl font-bold text-gray-900">{unparsedCount}</p>
      </div>
    </div>
  );
};
