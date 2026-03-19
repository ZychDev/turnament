import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let teams;
  try { teams = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!Array.isArray(teams)) {
    return Response.json({ error: 'Teams must be an array' }, { status: 400 });
  }

  const db = await readDb();
  db.teams = teams;
  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true });
}
