import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { roundId, bestOf } = body;

  if (!roundId || ![1, 3, 5].includes(bestOf)) {
    return Response.json({ error: 'Invalid roundId or bestOf value' }, { status: 400 });
  }

  const db = await readDb();

  for (const section of ['winners', 'losers']) {
    const round = db.bracket[section].find(r => r.id === roundId);
    if (round) { round.bestOf = bestOf; break; }
  }
  if (db.bracket.grandFinal?.id === roundId) {
    db.bracket.grandFinal.bestOf = bestOf;
  }

  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true, bracket: db.bracket });
}
