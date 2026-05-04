import { NextResponse } from 'next/server';
import { getUnparsedEmails, markEmailParsed } from '@/domains/email-sync/db';
import { insertTransaction } from '@/domains/shared/db';
import { parseEmail } from '@/domains/transaction-parsing';
import { createJob, updateJob } from '@/domains/notifications/jobStore';
import type { RawEmail } from '@/domains/shared/types';

export const POST = async () => {
  const unparsed = getUnparsedEmails() as RawEmail[];

  if (unparsed.length === 0) {
    return NextResponse.json({
      message: 'No unparsed emails',
      processed: 0,
      transactions_added: 0,
      errors: [],
    });
  }

  const job = createJob('parse');
  updateJob(job.id, {
    progress: { current: 0, total: unparsed.length },
    detail: `Parsing 0 of ${unparsed.length}…`,
  });

  (async () => {
    let totalTransactions = 0;
    const errors: { email_id: string; subject: string; error: string }[] = [];
    const skipped: { email_id: string; subject: string; reason: string }[] = [];

    for (let index = 0; index < unparsed.length; index++) {
      const email = unparsed[index];

      updateJob(job.id, {
        progress: { current: index + 1, total: unparsed.length },
        detail: `Parsing ${index + 1} of ${unparsed.length}…`,
      });

      try {
        const result = await parseEmail(email.body, email.sender, email.subject);

        if (result.unparseable) {
          skipped.push({
            email_id: email.id,
            subject: email.subject,
            reason: result.reason || 'Not a transaction email',
          });
          markEmailParsed(email.id);
          continue;
        }

        for (const tx of result.transactions) {
          insertTransaction({
            email_id: email.id,
            asset_type: tx.asset_type,
            ticker: tx.ticker,
            name: tx.name,
            quantity: tx.quantity,
            price: tx.price,
            currency: tx.currency,
            transaction_type: tx.transaction_type,
            transaction_date: tx.transaction_date,
            broker: tx.broker,
            raw_text: email.body.substring(0, 500),
            confidence: tx.confidence,
          });
          totalTransactions++;
        }

        markEmailParsed(email.id);
      } catch (error: any) {
        errors.push({
          email_id: email.id,
          subject: email.subject,
          error: error.message || 'Parse failed',
        });
      }
    }

    updateJob(job.id, {
      status: errors.length > 0 && totalTransactions === 0 ? 'error' : 'success',
      detail: `Done — ${totalTransactions} transactions added`,
      result: {
        processed: unparsed.length,
        transactions_added: totalTransactions,
        skipped,
        errors,
      },
      finishedAt: new Date(),
    });
  })();

  return NextResponse.json({ jobId: job.id });
};
