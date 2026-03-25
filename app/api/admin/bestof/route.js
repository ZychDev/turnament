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

  try {
    const db = await readDb();
    if (!db.bracket) return Response.json({ error: 'No bracket' }, { status: 400 });

    for (const section of ['winners', 'losers']) {
      const rounds = db.bracket[section];
      if (!rounds) continue;
      const round = rounds.find(r => r.id === roundId);
      if (round) { round.bestOf = bestOf; break; }
    }
    if (db.bracket.grandFinal?.id === roundId) {
      db.bracket.grandFinal.bestOf = bestOf;
    }

    await writeDbWithHistory(db);
    bumpVersion();
    return Response.json({ ok: true, bracket: db.bracket });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
