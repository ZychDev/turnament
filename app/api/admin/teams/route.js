import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const teams = await req.json();
  const db = await readDb();
  db.teams = teams;
  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true });
}
