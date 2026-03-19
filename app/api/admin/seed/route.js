import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { matchId, slot, teamId } = await req.json();
  const db = readDb();

  function findAndSet(rounds) {
    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.id === matchId) {
          if (slot === 1) match.t1 = teamId;
          else match.t2 = teamId;
          return true;
        }
      }
    }
    return false;
  }

  if (!findAndSet(db.bracket.winners) && !findAndSet(db.bracket.losers)) {
    const gf = db.bracket.grandFinal;
    for (const match of gf.matches) {
      if (match.id === matchId) {
        if (slot === 1) match.t1 = teamId;
        else match.t2 = teamId;
      }
    }
  }

  writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true, bracket: db.bracket });
}
