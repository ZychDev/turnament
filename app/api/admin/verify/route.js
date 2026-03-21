import { checkAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!await checkAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ ok: true });
}
