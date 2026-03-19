import { readDb, readArchives, writeArchive } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function GET() {
  const archives = await readArchives();
  return Response.json(archives);
}

export async function POST(req) {
  if (!await checkAuth(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await readDb();
  const { name } = await req.json().catch(() => ({}));

  await writeArchive(name || db.config.tournamentName || 'Tournament', db);
  const archives = await readArchives();

  return Response.json({ ok: true, count: archives.length });
}
