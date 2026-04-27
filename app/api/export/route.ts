import { getAllTransactions } from '@/domains/shared/db';
import { buildCsv } from '@/lib/export';

export const GET = async () => {
  try {
    const transactions = getAllTransactions();
    const csv = buildCsv(transactions);
    const filename = `portfolio-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
