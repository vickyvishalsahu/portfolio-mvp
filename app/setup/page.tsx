'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type GmailStatus = {
  gmailConnected: boolean;
};

const STEP_CIRCLE_BASE = 'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold';
const STEP_CIRCLE_DONE = `${STEP_CIRCLE_BASE} bg-green-800 text-green-300`;
const STEP_CIRCLE_PENDING = `${STEP_CIRCLE_BASE} bg-gray-800 text-gray-400`;

type StepProps = {
  number: number;
  label: string;
  done: boolean;
  children: React.ReactNode;
};

const SetupStep = ({ number, label, done, children }: StepProps) => (
  <div className="flex gap-4">
    <div className={done ? STEP_CIRCLE_DONE : STEP_CIRCLE_PENDING}>
      {done ? '✓' : number}
    </div>
    <div className="flex-1 pb-8">
      <p className={`font-medium mb-2 ${done ? 'text-green-400' : 'text-white'}`}>{label}</p>
      {children}
    </div>
  </div>
);

const SetupPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<GmailStatus | null>(null);

  useEffect(() => {
    fetch('/api/gmail/sync')
      .then((res) => res.json())
      .then((data: GmailStatus) => setStatus(data))
      .catch(() => setStatus({ gmailConnected: false }));
  }, []);

  const gmailConnected = status?.gmailConnected ?? false;

  const renderConnectGmailContent = () => {
    if (gmailConnected) {
      return <p className="text-gray-500 text-sm">{t('setup.steps.connectGmail.connected')}</p>;
    }
    return (
      <div>
        <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4 text-sm text-gray-400">
          <p className="text-gray-300 font-medium mb-1">{t('setup.steps.connectGmail.beforeConnectTitle')}</p>
          <p>
            {t('setup.steps.connectGmail.beforeConnectBody')}{' '}
            <span className="text-white">{t('setup.steps.connectGmail.localFirst')}</span>
          </p>
        </div>
        <a
          href="/api/gmail/auth"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm"
        >
          {t('setup.steps.connectGmail.connectButton')}
        </a>
      </div>
    );
  };

  const renderSyncContent = () => {
    if (!gmailConnected) {
      return <p className="text-gray-600 text-sm">{t('setup.steps.sync.locked')}</p>;
    }
    return (
      <a
        href="/sync"
        className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition text-sm"
      >
        {t('setup.steps.sync.goToSync')}
      </a>
    );
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold mb-2">{t('setup.title')}</h1>
      <p className="text-gray-500 mb-8 text-sm">{t('setup.subtitle')}</p>

      <div>
        <SetupStep number={1} label={t('setup.steps.appRunning.label')} done>
          <p className="text-gray-500 text-sm">{t('setup.steps.appRunning.description')}</p>
        </SetupStep>

        <SetupStep number={2} label={t('setup.steps.connectGmail.label')} done={gmailConnected}>
          {renderConnectGmailContent()}
        </SetupStep>

        <SetupStep number={3} label={t('setup.steps.sync.label')} done={false}>
          {renderSyncContent()}
        </SetupStep>
      </div>
    </div>
  );
};

export default SetupPage;
