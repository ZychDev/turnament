import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function PUT(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await readDb();
    const teams = [...db.teams];

    // Fisher-Yates shuffle
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    // Assign to WB R1 slots
    const wbR1 = db.bracket?.winners?.[0];
    if (!wbR1?.matches) return Response.json({ error: 'No WB R1 found' }, { status: 400 });

    wbR1.matches.forEach((match, idx) => {
      match.t1 = teams[idx * 2]?.id || null;
      match.t2 = teams[idx * 2 + 1]?.id || null;
    });

    await writeDbWithHistory(db);
    bumpVersion();
    return Response.json({ ok: true, bracket: db.bracket });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
