import { NextRequest, NextResponse } from 'next/server';
import { fetchBrokerEmails, insertRawEmail, getRawEmailCount, getParsedEmailCount, getSelectedInstitutions } from '@/domains/email-sync';
import { getRefreshToken } from '@/domains/email-sync';
import { createJob, updateJob } from '@/domains/notifications/jobStore';
import { KNOWN_BROKERS } from '@/domains/shared/constants';
import type { Institution } from '@/domains/shared/types';

const dedupeByDomain = (list: Institution[]) =>
  list.filter((item, i, arr) => arr.findIndex((x) => x.domain === item.domain) === i);

export const POST = async (req: NextRequest) => {
  if (!getRefreshToken()) {
    return NextResponse.json(
      { error: 'Gmail not connected. Visit /sync to connect.' },
      { status: 400 }
    );
  }

  const fullHistory = req.nextUrl.searchParams.get('full') === 'true';
  const userInstitutions = getSelectedInstitutions();
  const knownDomainInstitutions: Institution[] = KNOWN_BROKERS.flatMap((b) =>
    b.senderDomains.map((d) => ({ name: b.name, domain: d }))
  );
  const institutions = fullHistory
    ? dedupeByDomain([...userInstitutions, ...knownDomainInstitutions])
    : userInstitutions;
  const job = createJob('fetch');

  (async () => {
    try {
      let fetchedCount = 0;
      let newCount = 0;
      await fetchBrokerEmails(institutions, {
        fullHistory,
        onEmail: (email) => {
          const result = insertRawEmail(email);
          if (result.changes > 0) newCount++;
        },
        onProgress: (fetched) => {
          fetchedCount = fetched;
          updateJob(job.id, { detail: `Fetching… ${fetched} emails so far` });
        },
      });
      updateJob(job.id, {
        status: 'success',
        detail: `Found ${fetchedCount} emails (${newCount} new)`,
        result: { fetched: fetchedCount, new: newCount },
        finishedAt: new Date(),
      });
    } catch (error: any) {
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
