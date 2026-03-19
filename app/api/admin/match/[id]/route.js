import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { applyMatchResult } from '@/lib/bracket';

export async function PUT(req, { params }) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const db = await readDb();
  db.bracket = applyMatchResult(db.bracket, params.id, body);
  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true, bracket: db.bracket });
}
