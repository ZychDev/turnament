import { getMatchDetails } from '@/lib/riot';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('id');
  if (!matchId) return Response.json({ error: 'Missing match id (e.g. ?id=EUN1_1234567890)' }, { status: 400 });

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
    const riotMatchId = matchId.startsWith('EUN1_') || matchId.startsWith('EUW1_') ? matchId : `EUN1_${matchId}`;
    const match = await getMatchDetails(riotMatchId);
    if (!match) return Response.json({ error: 'Match not found in Riot API' }, { status: 404 });

    const { teams: dbTeams } = await readDb();

    // Map Riot participants to our tournament players
    const team100 = []; // blue side
    const team200 = []; // red side

    for (const p of match.info.participants) {
      const playerData = {
        riotName: `${p.riotIdGameName}#${p.riotIdTagline}`,
        summonerName: p.riotIdGameName || p.summonerName,
        champion: p.championName,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        cs: p.totalMinionsKilled + p.neutralMinionsKilled,
        role: p.teamPosition || p.individualPosition || '',
        win: p.win,
        teamId: p.teamId, // 100 or 200
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
        goldEarned: p.goldEarned,
        damageDealt: p.totalDamageDealtToChampions,
        visionScore: p.visionScore,
      };

      // Try to match to a tournament team by summoner name
      let matchedTeam = null;
      const pNameLower = playerData.summonerName.toLowerCase();
      const pRiotLower = playerData.riotName.toLowerCase();
      for (const t of dbTeams) {
        for (const tp of (t.players || [])) {
          const nick = (tp.summonerName || '').toLowerCase().trim();
          const fullRiotId = tp.riotTag ? `${nick}#${tp.riotTag.toLowerCase()}` : '';
          // Match by: exact name, full riot id, or name part of riot id
          if (nick === pNameLower || nick === pRiotLower ||
              (fullRiotId && fullRiotId === pRiotLower) ||
              pNameLower === nick || pRiotLower.split('#')[0] === nick) {
            matchedTeam = t;
            playerData.tournamentTeamId = t.id;
            playerData.tournamentRole = tp.role;
            break;
          }
        }
        if (matchedTeam) break;
      }

      if (p.teamId === 100) team100.push(playerData);
      else team200.push(playerData);
    }

    // Determine winner side
    const blueWin = match.info.teams.find(t => t.teamId === 100)?.win;

    return Response.json({
      matchId: riotMatchId,
      gameMode: match.info.gameMode,
      gameDuration: match.info.gameDuration,
      gameCreation: match.info.gameCreation,
      blueTeam: team100,
      redTeam: team200,
      blueWin,
      // Summary for quick overview
      summary: {
        duration: `${Math.floor(match.info.gameDuration / 60)}:${String(match.info.gameDuration % 60).padStart(2, '0')}`,
        winner: blueWin ? 'blue' : 'red',
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
