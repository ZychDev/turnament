import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { matchId, slot, teamId } = body;

  if (!matchId || (slot !== 1 && slot !== 2)) {
    return Response.json({ error: 'Invalid matchId or slot' }, { status: 400 });
  }

  const db = await readDb();

  // Validate teamId exists (if not removing assignment)
  if (teamId && !db.teams.some(t => t.id === teamId)) {
    return Response.json({ error: 'Team not found' }, { status: 400 });
  }

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
    for (const match of (gf?.matches || [])) {
      if (match.id === matchId) {
        if (slot === 1) match.t1 = teamId;
        else match.t2 = teamId;
      }
    }
  }

  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true, bracket: db.bracket });
}
