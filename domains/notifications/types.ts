export type NotificationStatus = 'in-progress' | 'success' | 'error';

export type Notification = {
  id: string;
  status: NotificationStatus;
  title: string;
  detail: string;
  timestamp: Date;
  read: boolean;
};

export type JobType = 'fetch' | 'parse';

export type Job = {
  id: string;
  type: JobType;
  status: NotificationStatus;
  progress: { current: number; total: number } | null;
  detail: string;
  result?: Record<string, unknown>;
  startedAt: Date;
  finishedAt?: Date;
};
