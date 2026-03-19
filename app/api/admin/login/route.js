import { readDb } from '@/lib/db';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const db = await readDb();
  if (body.password === db.config.adminPassword) return Response.json({ ok: true });
  return Response.json({ error: 'Wrong password' }, { status: 401 });
}
