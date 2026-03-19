import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { tournamentName, newPassword, oldPassword } = body;

  const db = await readDb();

  if (tournamentName) {
    db.config.tournamentName = String(tournamentName).slice(0, 100);
  }

  if (newPassword) {
    if (oldPassword !== db.config.adminPassword) {
      return Response.json({ error: 'Stare haslo jest nieprawidlowe' }, { status: 400 });
    }
    if (String(newPassword).length < 4) {
      return Response.json({ error: 'Haslo musi miec co najmniej 4 znaki' }, { status: 400 });
    }
    db.config.adminPassword = String(newPassword);
  }

  await writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true });
}
