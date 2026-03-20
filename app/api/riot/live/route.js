import { getAccountByRiotId, getCurrentGame, parseRiotId, getDDragonVersion } from '@/lib/riot';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.RIOT_API_KEY) {
    return Response.json({ error: 'Riot API key not configured' }, { status: 500 });
  }

  try {
    const { teams } = await readDb();
    const version = await getDDragonVersion();
    const liveGames = [];

    // Check each team's players (only captains to save rate limit)
    const checked = new Set();
    for (const team of teams) {
      for (const player of (team.players || [])) {
        const name = player.summonerName;
        if (!name || checked.has(name.toLowerCase())) continue;
        checked.add(name.toLowerCase());

        try {
          const { gameName, tagLine } = parseRiotId(name);
          const account = await getAccountByRiotId(gameName, tagLine);
          if (!account) continue;

          const game = await getCurrentGame(account.puuid);
          if (game) {
            const participant = game.participants?.find(p => p.puuid === account.puuid);
            // Check if any other tournament players are in the same game
            const otherPlayers = [];
            for (const p of (game.participants || [])) {
              if (p.puuid === account.puuid) continue;
              // Check if this participant is also a tournament player
              for (const t of teams) {
                for (const tp of (t.players || [])) {
                  const { gameName: gn, tagLine: tl } = parseRiotId(tp.summonerName);
                  if (p.riotId && p.riotId.toLowerCase() === `${gn}#${tl}`.toLowerCase()) {
                    otherPlayers.push({ summonerName: tp.summonerName, teamId: t.id, teamTag: t.tag });
                  }
                }
              }
            }

            liveGames.push({
              summonerName: name,
              teamId: team.id,
              teamTag: team.tag,
              gameMode: game.gameMode,
              gameLength: game.gameLength,
              championId: participant?.championId,
              otherTournamentPlayers: otherPlayers,
              isTournamentMatch: otherPlayers.length >= 4, // 5v5 with at least 5 tournament players total
            });
          }
        } catch (e) { /* skip errors, don't break the loop */ }
      }
    }

    return Response.json({ liveGames, version }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
