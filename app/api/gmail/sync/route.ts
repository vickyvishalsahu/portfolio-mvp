import { NextResponse } from 'next/server';
import { fetchBrokerEmails, insertRawEmail, getRawEmailCount, getParsedEmailCount, getSelectedInstitutions } from '@/domains/email-sync';
import { getRefreshToken } from '@/domains/email-sync';
import { createJob, updateJob } from '@/domains/notifications/jobStore';

export const POST = async () => {
  if (!getRefreshToken()) {
    return NextResponse.json(
      { error: 'Gmail not connected. Visit /sync to connect.' },
      { status: 400 }
    );
  }

  const institutions = getSelectedInstitutions();

  const job = createJob('fetch');

  (async () => {
    try {
      const emails = await fetchBrokerEmails(institutions, 100);
      let newCount = 0;
      for (const email of emails) {
        const result = insertRawEmail(email);
        if (result.changes > 0) newCount++;
      }
      updateJob(job.id, {
        status: 'success',
        detail: `Found ${emails.length} emails (${newCount} new)`,
        result: { fetched: emails.length, new: newCount },
        finishedAt: new Date(),
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      updateJob(job.id, {
        status: 'error',
        detail: error.message || 'Fetch failed',
        finishedAt: new Date(),
      });
    }
  })();

  return NextResponse.json({ jobId: job.id });
};

export const GET = async () => {
  try {
    return NextResponse.json({
      totalRaw: getRawEmailCount(),
      totalParsed: getParsedEmailCount(),
      gmailConnected: !!getRefreshToken(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
