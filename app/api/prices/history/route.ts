import { NextResponse } from 'next/server';
import { getHistoryBackfillTargets } from '@/domains/shared/db';
import { backfillPriceHistory } from '@/domains/pricing';
import { createJob, updateJob } from '@/domains/notifications/jobStore';

export const POST = async () => {
  const targets = getHistoryBackfillTargets();

  if (targets.length === 0) {
    return NextResponse.json({ message: 'No holdings to backfill', updated: 0, failed: [] });
  }

  const job = createJob('history');
  updateJob(job.id, {
    progress: { current: 0, total: targets.length },
    detail: `Backfilling 0 of ${targets.length}…`,
  });

  (async () => {
    try {
      const result = await backfillPriceHistory(targets, {
        onProgress: (current, total) => {
          updateJob(job.id, {
            progress: { current, total },
            detail: `Backfilling ${current} of ${total}…`,
          });
        },
      });

      updateJob(job.id, {
        status: result.failed.length > 0 && result.updated === 0 ? 'error' : 'success',
        detail: `Done — ${result.updated} tickers updated${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
        result: { updated: result.updated, failed: result.failed },
        finishedAt: new Date(),
      });
    } catch (error: any) {
      updateJob(job.id, {
        status: 'error',
        detail: error.message || 'Backfill failed',
        finishedAt: new Date(),
      });
    }
  })();

  return NextResponse.json({ jobId: job.id });
};
