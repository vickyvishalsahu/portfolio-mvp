'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type GmailStatus = {
  gmailConnected: boolean;
};

const STEP_CIRCLE_BASE = 'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold';
const STEP_CIRCLE_DONE = `${STEP_CIRCLE_BASE} bg-emerald-100 text-emerald-700`;
const STEP_CIRCLE_PENDING = `${STEP_CIRCLE_BASE} bg-slate-100 text-gray-500`;

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
      <p className={`font-medium mb-2 ${done ? 'text-emerald-700' : 'text-gray-900'}`}>{label}</p>
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
      return <p className="text-gray-400 text-sm">{t('setup.steps.connectGmail.connected')}</p>;
    }
    return (
      <div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-sm text-gray-600">
          <p className="text-gray-800 font-medium mb-1">{t('setup.steps.connectGmail.beforeConnectTitle')}</p>
          <p>
            {t('setup.steps.connectGmail.beforeConnectBody')}{' '}
            <span className="text-gray-900">{t('setup.steps.connectGmail.localFirst')}</span>
          </p>
        </div>
        <a
          href="/api/gmail/auth"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition text-sm"
        >
          {t('setup.steps.connectGmail.connectButton')}
        </a>
      </div>
    );
  };

  const renderSyncContent = () => {
    if (!gmailConnected) {
      return <p className="text-gray-400 text-sm">{t('setup.steps.sync.locked')}</p>;
    }
    return (
      <a
        href="/sync"
        className="inline-block bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2 rounded-lg transition text-sm"
      >
        {t('setup.steps.sync.goToSync')}
      </a>
    );
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('setup.title')}</h1>
      <p className="text-gray-500 mb-8 text-sm">{t('setup.subtitle')}</p>

      <div>
        <SetupStep number={1} label={t('setup.steps.appRunning.label')} done>
          <p className="text-gray-400 text-sm">{t('setup.steps.appRunning.description')}</p>
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
