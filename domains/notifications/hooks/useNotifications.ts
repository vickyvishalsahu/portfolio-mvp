'use client';

import { useState, useEffect, useRef } from 'react';
import type { Notification, Job } from '../types';

const jobToNotification = (job: Job): Notification => ({
  id: job.id,
  status: job.status,
  title: job.type === 'fetch' ? 'Fetch emails' : 'Parse emails',
  detail: job.detail,
  timestamp: new Date(job.startedAt),
  read: job.status !== 'in-progress',
});

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const jobsRef = useRef<Job[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const jobs: Job[] = await response.json();
      jobsRef.current = jobs;
      setNotifications(jobs.map(jobToNotification));
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      await fetchJobs();
      const hasActive = jobsRef.current.some((job) => job.status === 'in-progress');
      if (hasActive && !stopped) {
        timeoutRef.current = setTimeout(poll, 3000);
      }
    };

    const onSyncStarted = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      poll();
    };

    window.addEventListener('portfolio:sync-started', onSyncStarted);
    poll();

    return () => {
      stopped = true;
      window.removeEventListener('portfolio:sync-started', onSyncStarted);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllRead = () =>
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );

  const clearAll = () => setNotifications([]);

  return { notifications, unreadCount, markAllRead, clearAll };
};
