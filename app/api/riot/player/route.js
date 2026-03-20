import { getPlayerProfile, parseRiotId } from '@/lib/riot';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) return Response.json({ error: 'Missing name parameter (e.g. ?name=Player%23TAG)' }, { status: 400 });

  if (!process.env.RIOT_API_KEY) {
    return Response.json({ error: 'Riot API key not configured' }, { status: 500 });
  }

  try {
    const { gameName, tagLine } = parseRiotId(name);
    const profile = await getPlayerProfile(gameName, tagLine);
    if (!profile) return Response.json({ error: 'Player not found' }, { status: 404 });
    return Response.json(profile, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
