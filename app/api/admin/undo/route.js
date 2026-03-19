import { undoLast, readHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const result = undoLast();
  if (!result) return Response.json({ error: 'Brak historii do cofniecia' }, { status: 400 });

  bumpVersion();
  return Response.json({ ok: true });
}

export async function GET(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const history = readHistory();
  return Response.json({ count: history.length, history: history.map(h => ({ timestamp: h.timestamp })) });
}
