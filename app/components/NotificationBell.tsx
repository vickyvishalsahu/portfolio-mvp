'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/domains/notifications/hooks/useNotifications';
import type { Notification } from '@/domains/notifications/types';

const NotificationIcon = ({ status }: { status: Notification['status'] }) => {
  if (status === 'in-progress') {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
    );
  }
  if (status === 'success') {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { t } = useTranslation();

  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return t('notifications.timeAgo.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('notifications.timeAgo.minsAgo', { minutes });
    const hours = Math.floor(minutes / 60);
    return t('notifications.timeAgo.hoursAgo', { hours });
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800 transition">
      <div className="mt-0.5">
        <NotificationIcon status={notification.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">{notification.title}</span>
          {!notification.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{notification.detail}</p>
        <p className="text-xs text-gray-600 mt-1">{formatRelativeTime(notification.timestamp)}</p>
      </div>
    </div>
  );
};

export const NotificationBell = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutside =
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target);
      if (clickedOutside) setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open) markAllRead();
    setOpen((prev) => !prev);
  };

  const renderEmpty = () => (
    <p className="text-sm text-gray-600 text-center py-8">{t('notifications.noActivity')}</p>
  );

  const renderList = () => (
    <div className="divide-y divide-gray-800">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 text-gray-400 hover:text-white transition"
        aria-label={t('notifications.ariaLabel')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-white">{t('notifications.title')}</span>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-300 transition"
              >
                {t('notifications.clearAll')}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? renderEmpty() : renderList()}
          </div>
        </div>
      )}
    </div>
  );
};
