import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { sanitize, isValidUrl } from '@/lib/sanitize';

export async function PUT(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let teams;
  try { teams = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!Array.isArray(teams)) {
    return Response.json({ error: 'Teams must be an array' }, { status: 400 });
  }

  if (teams.length > 16) {
    return Response.json({ error: 'Too many teams (max 16)' }, { status: 400 });
  }

  // Validate and sanitize each team
  const sanitizedTeams = teams.map(t => ({
    ...t,
    name: String(t.name || '').slice(0, 50),
    tag: String(t.tag || '').slice(0, 10),
    avatar: String(t.avatar || '⚔️').slice(0, 4),
    customIcon: t.customIcon && isValidUrl(t.customIcon) ? t.customIcon.slice(0, 500) : (t.customIcon?.startsWith('data:image/') ? t.customIcon : ''),
    players: Array.isArray(t.players) ? t.players.slice(0, 7).map(p => ({
      ...p,
      summonerName: String(p.summonerName || '').slice(0, 30),
      riotTag: String(p.riotTag || '').slice(0, 10),
      role: String(p.role || '').slice(0, 10),
      opgg: p.opgg && isValidUrl(p.opgg) ? p.opgg.slice(0, 200) : '',
    })) : [],
  }));

  const db = await readDb();
  db.teams = sanitizedTeams;
  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true });
}
