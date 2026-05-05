'use client';

import { useTranslation } from 'react-i18next';

export const GmailDisconnected = () => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-red-400">{t('sync.gmail.notConnected')}</span>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4 text-sm text-gray-400">
        <p className="mb-1 font-medium text-gray-300">{t('sync.gmail.beforeConnect.title')}</p>
        <p>
          {t('sync.gmail.beforeConnect.bodyPrefix')}{' '}
          <span className="text-white">{t('sync.gmail.beforeConnect.readOnly')}</span>{' '}
          {t('sync.gmail.beforeConnect.bodySuffix')}{' '}
          <span className="text-white">{t('sync.gmail.beforeConnect.staysOnDevice')}</span>
        </p>
      </div>
      <a
        href="/api/gmail/auth"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        {t('sync.gmail.beforeConnect.connectButton')}
      </a>
    </div>
  );
};
