import { readDb } from '@/lib/db';

export async function POST(req) {
  const { password } = await req.json();
  const db = readDb();
  if (password === db.config.adminPassword) return Response.json({ ok: true });
  return Response.json({ error: 'Wrong password' }, { status: 401 });
}
