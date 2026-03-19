import { readDb } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

const checkLimit = rateLimit(10, 60_000);

export async function POST(req) {
  const { success } = checkLimit(req);
  if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const db = await readDb();
  if (body.password === db.config.adminPassword) return Response.json({ ok: true });
  return Response.json({ error: 'Wrong password' }, { status: 401 });
}
