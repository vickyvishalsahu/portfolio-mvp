'use client';

import { useState } from 'react';
import { MOCK_NOTIFICATIONS } from '../constants';
import type { Notification } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllRead = () =>
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );

  const clearAll = () => setNotifications([]);

  return { notifications, unreadCount, markAllRead, clearAll };
};
