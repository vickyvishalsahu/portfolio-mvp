import { NextResponse } from 'next/server';
import { getUnparsedEmails, markEmailParsed, insertTransaction } from '@/lib/db';
import { parseEmail } from '@/lib/parser';
import type { RawEmail } from '@/types';

export async function POST() {
  try {
    const unparsed = getUnparsedEmails() as RawEmail[];

    if (unparsed.length === 0) {
      return NextResponse.json({
        message: 'No unparsed emails',
        processed: 0,
        transactions_added: 0,
        errors: [],
      });
    }

    let totalTransactions = 0;
    const errors: { email_id: string; subject: string; error: string }[] = [];
    const skipped: { email_id: string; subject: string; reason: string }[] = [];

    for (const email of unparsed) {
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

    return NextResponse.json({
      processed: unparsed.length,
      transactions_added: totalTransactions,
      skipped,
      errors,
    });
  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error.message || 'Parse failed' },
      { status: 500 }
    );
  }
}
