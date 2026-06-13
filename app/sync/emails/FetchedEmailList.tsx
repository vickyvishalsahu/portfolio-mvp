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
      <span className="text-sm font-medium text-gray-700">
        {t('sync.emails.fetched', { count: emails.length })}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-gray-400 hover:text-gray-600 text-xs transition"
      >
        {expanded ? t('sync.emails.collapse') : t('sync.emails.expand')}
      </button>
    </div>
  );

  const renderEmailRow = (email: EmailListItem) => {
    const date = new Date(email.receivedAt).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const senderName = email.sender.replace(/<.*>/, '').trim() || email.sender;
    const statusEl = email.parsed
      ? <span className="text-emerald-600 text-xs">{t('sync.emails.status.parsed')}</span>
      : <span className="text-amber-600 text-xs">{t('sync.emails.status.pending')}</span>;

    return (
      <tr key={email.id} className="border-b border-slate-50">
        <td className="py-2 pr-4 text-gray-500 max-w-[160px] truncate">{senderName}</td>
        <td className="py-2 pr-4 text-gray-700 max-w-xs truncate">{email.subject}</td>
        <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{date}</td>
        <td className="py-2">{statusEl}</td>
      </tr>
    );
  };

  const renderList = () => {
    if (!expanded) return null;

    return (
      <>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-slate-100">
              <th className="text-left pb-2 font-normal">{t('sync.emails.columns.from')}</th>
              <th className="text-left pb-2 font-normal">{t('sync.emails.columns.subject')}</th>
              <th className="text-left pb-2 font-normal whitespace-nowrap">{t('sync.emails.columns.date')}</th>
              <th className="text-left pb-2 font-normal">{t('sync.emails.columns.status')}</th>
            </tr>
          </thead>
          <tbody>{visibleEmails.map(renderEmailRow)}</tbody>
        </table>
        {emails.length > MAX_DEFAULT && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-gray-400 hover:text-gray-600 text-xs mt-3 transition"
          >
            {t('sync.emails.showAll', { count: emails.length })}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
      {renderHeader()}
      {renderList()}
    </div>
  );
};
