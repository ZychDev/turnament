import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { roundId, bestOf } = await req.json();
  const db = readDb();

  for (const section of ['winners', 'losers']) {
    const round = db.bracket[section].find(r => r.id === roundId);
    if (round) { round.bestOf = bestOf; break; }
  }
  if (db.bracket.grandFinal?.id === roundId) {
    db.bracket.grandFinal.bestOf = bestOf;
  }

  writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true, bracket: db.bracket });
}
