'use client';

import { useTranslation } from 'react-i18next';

export const GmailDisconnected = () => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-red-500">{t('sync.gmail.notConnected')}</span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-sm text-gray-600">
        <p className="mb-1 font-medium text-gray-800">{t('sync.gmail.beforeConnect.title')}</p>
        <p>
          {t('sync.gmail.beforeConnect.bodyPrefix')}{' '}
          <span className="text-gray-900">{t('sync.gmail.beforeConnect.readOnly')}</span>{' '}
          {t('sync.gmail.beforeConnect.bodySuffix')}{' '}
          <span className="text-gray-900">{t('sync.gmail.beforeConnect.staysOnDevice')}</span>
        </p>
      </div>
      <a
        href="/api/gmail/auth"
        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
      >
        {t('sync.gmail.beforeConnect.connectButton')}
      </a>
    </div>
  );
};
