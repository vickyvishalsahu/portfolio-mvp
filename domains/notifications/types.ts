export type NotificationStatus = 'in-progress' | 'success' | 'error';

export type Notification = {
  id: string;
  status: NotificationStatus;
  title: string;
  detail: string;
  timestamp: Date;
  read: boolean;
};
