import type { Job, JobType } from './types';

const store = new Map<string, Job>();

export const createJob = (type: JobType): Job => {
  const job: Job = {
    id: crypto.randomUUID(),
    type,
    status: 'in-progress',
    progress: null,
    detail: type === 'fetch' ? 'Fetching emails…' : 'Starting parse…',
    startedAt: new Date(),
  };
  store.set(job.id, job);
  return job;
};

export const updateJob = (id: string, patch: Partial<Job>): void => {
  const existing = store.get(id);
  if (!existing) return;
  store.set(id, { ...existing, ...patch });
};

export const getJobs = (): Job[] =>
  [...store.values()]
    .sort((jobA, jobB) => jobB.startedAt.getTime() - jobA.startedAt.getTime())
    .slice(0, 20);
