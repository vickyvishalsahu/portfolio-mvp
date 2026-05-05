'use client';

import { useTranslation } from 'react-i18next';

type Props = {
  onDisconnect: () => void;
};

export const GmailConnected = ({ onDisconnect }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <span className="w-2 h-2 bg-green-500 rounded-full" />
      <span className="text-green-400">{t('sync.gmail.connected')}</span>
      <button
        onClick={onDisconnect}
        className="text-gray-600 hover:text-gray-400 text-xs transition"
      >
        {t('sync.gmail.disconnect')}
      </button>
    </div>
  );
};
