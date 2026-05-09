'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmailListItem } from '@/domains/email-sync';

type Props = {
  emails: EmailListItem[];
};

const MAX_DEFAULT = 50;

export const FetchedEmailList = ({ emails }: Props) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const visibleEmails = showAll ? emails : emails.slice(0, MAX_DEFAULT);

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-gray-300">
        {t('sync.emails.fetched', { count: emails.length })}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-gray-500 hover:text-gray-300 text-xs transition"
      >
        {expanded ? t('sync.emails.collapse') : t('sync.emails.expand')}
      </button>
    </div>
  );

  const renderList = () => {
    if (!expanded) return null;

    return (
      <>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left pb-2 font-normal">{t('sync.emails.columns.from')}</th>
              <th className="text-left pb-2 font-normal">{t('sync.emails.columns.subject')}</th>
              <th className="text-left pb-2 font-normal whitespace-nowrap">{t('sync.emails.columns.date')}</th>
              <th className="text-left pb-2 font-normal">{t('sync.emails.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleEmails.map((email) => {
              const date = new Date(email.receivedAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              });
              const senderName = email.sender.replace(/<.*>/, '').trim() || email.sender;

              return (
                <tr key={email.id} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 text-gray-400 max-w-[160px] truncate">{senderName}</td>
                  <td className="py-2 pr-4 text-gray-300 max-w-xs truncate">{email.subject}</td>
                  <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">{date}</td>
                  <td className="py-2">
                    {email.parsed
                      ? <span className="text-green-600 text-xs">{t('sync.emails.status.parsed')}</span>
                      : <span className="text-yellow-600 text-xs">{t('sync.emails.status.pending')}</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {emails.length > MAX_DEFAULT && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-gray-500 hover:text-gray-300 text-xs mt-3 transition"
          >
            {t('sync.emails.showAll', { count: emails.length })}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      {renderHeader()}
      {renderList()}
    </div>
  );
};
