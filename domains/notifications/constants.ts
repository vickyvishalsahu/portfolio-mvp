import type { Notification } from './types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    status: 'in-progress',
    title: 'Parsing emails',
    detail: 'Processing 3 of 12…',
    timestamp: new Date(Date.now() - 30 * 1000),
    read: false,
  },
  {
    id: '2',
    status: 'success',
    title: 'Fetch complete',
    detail: 'Found 9 emails from Zerodha',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    status: 'error',
    title: 'Parse failed',
    detail: 'Could not connect to Claude API',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    read: true,
  },
];
