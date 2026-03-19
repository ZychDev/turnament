import { readDb } from '@/lib/db';
import { getAllMatches } from '@/lib/bracket';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { teams, bracket } = await readDb();
  const teamStats = {};
  teams.forEach(t => { teamStats[t.id] = { wins: 0, losses: 0 }; });

  const playerStats = {};
  teams.forEach(t => (t.players || []).forEach(p => {
    playerStats[`${t.id}:${p.role}`] = { ...p, teamId: t.id, kills: 0, deaths: 0, assists: 0, cs: 0, games: 0, champions: [] };
  }));

  const allMatches = getAllMatches(bracket);
  for (const match of allMatches) {
    if (match.winner) {
      if (teamStats[match.winner]) teamStats[match.winner].wins++;
      const loser = match.winner === match.t1 ? match.t2 : match.t1;
      if (loser && teamStats[loser]) teamStats[loser].losses++;
    }
    for (const game of (match.games || [])) {
      for (const p of (game.players || [])) {
        const key = `${p.teamId}:${p.role}`;
        if (playerStats[key]) {
          playerStats[key].kills += p.kills || 0;
          playerStats[key].deaths += p.deaths || 0;
          playerStats[key].assists += p.assists || 0;
          playerStats[key].cs += p.cs || 0;
          playerStats[key].games++;
          if (p.champion && !playerStats[key].champions.includes(p.champion))
            playerStats[key].champions.push(p.champion);
        }
      }
    }
  }

  const players = Object.values(playerStats)
    .filter(p => p.games > 0)
    .map(p => ({
      ...p,
      team: teams.find(t => t.id === p.teamId),
      kda: p.deaths > 0 ? ((p.kills + p.assists) / p.deaths).toFixed(2) : p.kills + p.assists > 0 ? 'Perfect' : '0',
    }))
    .sort((a, b) => parseFloat(b.kda) - parseFloat(a.kda));

  const teamsArr = Object.entries(teamStats)
    .map(([id, s]) => ({ ...s, team: teams.find(t => t.id === id) }))
    .filter(t => t.team && t.wins + t.losses > 0)
    .sort((a, b) => b.wins - a.wins);

  return Response.json({ players, teams: teamsArr }, { headers: { 'Cache-Control': 'no-store' } });
}
