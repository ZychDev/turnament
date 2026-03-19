import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { tournamentName, newPassword, oldPassword } = await req.json();
  const db = readDb();

  if (tournamentName) db.config.tournamentName = tournamentName;

  if (newPassword) {
    if (oldPassword !== db.config.adminPassword) {
      return Response.json({ error: 'Stare haslo jest nieprawidlowe' }, { status: 400 });
    }
    db.config.adminPassword = newPassword;
  }

  writeDbWithHistory(db);
  bumpVersion();
  return Response.json({ ok: true });
}
