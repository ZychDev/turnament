import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await readDb();
    return Response.json({
      status: 'ok',
      teams: db.teams?.length || 0,
      riotApi: !!process.env.RIOT_API_KEY,
      timestamp: Date.now(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
