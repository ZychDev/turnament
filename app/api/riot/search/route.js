import { getAccountByRiotId, getMatchIds, getMatchDetails, parseRiotId, getDDragonVersion } from '@/lib/riot';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) return Response.json({ error: 'Missing name param' }, { status: 400 });

  if (!process.env.RIOT_API_KEY) {
    return Response.json({ error: 'Riot API key not configured' }, { status: 500 });
  }

  // Verify admin auth
  const auth = req.headers.get('authorization');
  const { config } = await readDb();
  const pwd = config?.adminPassword || process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
  if (auth !== `Bearer ${pwd}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { gameName, tagLine } = parseRiotId(name);
    const account = await getAccountByRiotId(gameName, tagLine);
    if (!account) return Response.json({ error: 'Player not found' }, { status: 404 });

    // Get last 10 matches (all types including custom)
    const matchIds = await getMatchIds(account.puuid, 10, null) || [];

    const version = await getDDragonVersion();
    const matches = [];

    for (const id of matchIds) {
      try {
        const match = await getMatchDetails(id);
        if (!match) continue;

        const player = match.info.participants.find(p => p.puuid === account.puuid);
        const duration = match.info.gameDuration;
        const mins = Math.floor(duration / 60);
        const secs = String(duration % 60).padStart(2, '0');

        // Get all 10 player names for preview
        const blueSide = match.info.participants.filter(p => p.teamId === 100).map(p => ({
          name: p.riotIdGameName || p.summonerName,
          champion: p.championName,
        }));
        const redSide = match.info.participants.filter(p => p.teamId === 200).map(p => ({
          name: p.riotIdGameName || p.summonerName,
          champion: p.championName,
        }));

        const blueWin = match.info.teams.find(t => t.teamId === 100)?.win;

        matches.push({
          matchId: id,
          gameMode: match.info.gameMode,
          gameType: match.info.gameType,
          queueId: match.info.queueId,
          isCustom: match.info.gameMode === 'CLASSIC' && match.info.queueId === 0,
          duration: `${mins}:${secs}`,
          timestamp: match.info.gameCreation,
          date: new Date(match.info.gameCreation).toLocaleString(),
          blueWin,
          blueSide,
          redSide,
          playerChampion: player?.championName,
          playerWin: player?.win,
        });
      } catch (e) { /* skip */ }
    }

    return Response.json({ matches, version }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
