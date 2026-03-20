import { getChampions, getDDragonVersion } from '@/lib/riot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [champions, version] = await Promise.all([getChampions(), getDDragonVersion()]);
    return Response.json({ champions, version }, {
      headers: { 'Cache-Control': 'public, max-age=86400' }, // cache 24h - champions don't change often
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
