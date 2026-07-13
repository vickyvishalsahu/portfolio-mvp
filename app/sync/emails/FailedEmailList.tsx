'use client';

import { useTranslation } from 'react-i18next';
import type { RawEmail } from '@/domains/shared/types';

type Props = {
  emails: RawEmail[];
  retryingId: string | null;
  onRetry: (emailId: string) => void;
};

export const FailedEmailList = ({ emails, retryingId, onRetry }: Props) => {
  const { t } = useTranslation();

  if (emails.length === 0) return null;

  const renderRow = (email: RawEmail) => {
    const date = new Date(email.receivedAt).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const senderName = email.sender.replace(/<.*>/, '').trim() || email.sender;
    const isRetrying = retryingId === email.id;
    const retryLabel = isRetrying ? t('sync.emails.failed.retrying') : t('sync.emails.failed.retry');
    const manualEntryHref = `/transactions/new?emailId=${encodeURIComponent(email.id)}&subject=${encodeURIComponent(email.subject)}`;

    return (
      <tr key={email.id} className="border-b border-amber-100">
        <td className="py-2 pr-4 text-gray-500 max-w-[160px] truncate">{senderName}</td>
        <td className="py-2 pr-4 text-gray-700 max-w-xs truncate">{email.subject}</td>
        <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{date}</td>
        <td className="py-2 pr-4 text-amber-700 max-w-xs truncate">{email.parseError}</td>
        <td className="py-2 whitespace-nowrap">
          <button
            onClick={() => onRetry(email.id)}
            disabled={isRetrying}
            className="text-indigo-600 hover:underline disabled:opacity-50 text-xs mr-3"
          >
            {retryLabel}
          </button>
          <a href={manualEntryHref} className="text-indigo-600 hover:underline text-xs">
            {t('sync.emails.failed.enterManually')}
          </a>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
      <p className="text-sm font-medium text-amber-700 mb-3">
        {t('sync.emails.failed.title', { count: emails.length })}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-amber-100">
            <th className="text-left pb-2 font-normal">{t('sync.emails.columns.from')}</th>
            <th className="text-left pb-2 font-normal">{t('sync.emails.columns.subject')}</th>
            <th className="text-left pb-2 font-normal whitespace-nowrap">{t('sync.emails.columns.date')}</th>
            <th className="text-left pb-2 font-normal">{t('sync.emails.columns.error')}</th>
            <th className="text-left pb-2 font-normal" />
          </tr>
        </thead>
        <tbody>{emails.map(renderRow)}</tbody>
      </table>
    </div>
  );
};
