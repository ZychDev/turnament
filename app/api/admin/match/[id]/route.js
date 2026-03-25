import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { applyMatchResult } from '@/lib/bracket';

export async function PUT(req, { params }) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Clamp wins to non-negative integers
  if (body.wins && Array.isArray(body.wins)) {
    body.wins = body.wins.map(w => Math.max(0, parseInt(w) || 0));
  } else if (body.wins) {
    body.wins = [0, 0];
  }

  // Sanitize games stats
  if (body.games) {
    for (const game of body.games) {
      if (game.players) {
        for (const p of game.players) {
          p.kills = Math.max(0, parseInt(p.kills) || 0);
          p.deaths = Math.max(0, parseInt(p.deaths) || 0);
          p.assists = Math.max(0, parseInt(p.assists) || 0);
          p.cs = Math.max(0, parseInt(p.cs) || 0);
        }
      }
    }
  }

  const db = await readDb();
  db.bracket = applyMatchResult(db.bracket, params.id, body);
  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true, bracket: db.bracket });
}
