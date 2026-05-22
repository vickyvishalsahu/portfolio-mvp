import { deleteManualTransaction } from '@/domains/shared/db';

export const DELETE = async (_req: Request, { params }: { params: { id: string } }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const deleted = deleteManualTransaction(id);
    if (!deleted) {
      return Response.json({ error: 'Not found or not a manual transaction' }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
