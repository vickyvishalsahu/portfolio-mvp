'use client';

import type { SyncStatus } from '@/domains/email-sync/hooks/useGmailSync';
import { GmailLoading } from './GmailLoading';
import { GmailConnected } from './GmailConnected';
import { GmailDisconnected } from './GmailDisconnected';

type Props = {
  status: SyncStatus | null;
  onDisconnect: () => void;
};

export const GmailConnection = ({ status, onDisconnect }: Props) => {
  const renderStatus = () => {
    if (status === null) return <GmailLoading />;
    if (status.gmail_connected) return <GmailConnected onDisconnect={onDisconnect} />;
    return <GmailDisconnected />;
  };

  return renderStatus();
};
