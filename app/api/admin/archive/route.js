import { readDb, readArchives, writeArchive } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function GET() {
  try {
    const archives = await readArchives();
    return Response.json(archives, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!await checkAuth(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await readDb();
    const { name } = await req.json().catch(() => ({}));

    await writeArchive(name || db.config?.tournamentName || 'Tournament', db);
    const archives = await readArchives();

    return Response.json({ ok: true, count: archives.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
