import { readDb } from '@/lib/db';
import { getAllMatches } from '@/lib/bracket';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const db = await readDb();
  const { teams, bracket } = db;

  const matches = getAllMatches(bracket);
  const getTeam = (id) => teams.find(t => t.id === id);

  if (format === 'csv') {
    const lines = ['Mecz,Runda,Druzyna 1,Druzyna 2,Wynik,Zwyciezca,Czas'];
    for (const m of matches) {
      const t1 = getTeam(m.t1);
      const t2 = getTeam(m.t2);
      const winner = getTeam(m.winner);
      lines.push([
        m.id,
        m.roundName,
        t1 ? `${t1.tag} ${t1.name}` : 'TBD',
        t2 ? `${t2.tag} ${t2.name}` : 'TBD',
        `${m.wins[0]}-${m.wins[1]}`,
        winner ? `${winner.tag} ${winner.name}` : '-',
        m.scheduledTime || '-',
      ].join(','));
    }

    return new Response(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="turniej_wyniki.csv"`,
      },
    });
  }

  // JSON format
  return Response.json({
    tournamentName: db.config.tournamentName,
    teams: teams.map(t => ({ id: t.id, name: t.name, tag: t.tag, players: t.players })),
    matches: matches.map(m => ({
      id: m.id,
      round: m.roundName,
      team1: getTeam(m.t1)?.name || null,
      team2: getTeam(m.t2)?.name || null,
      score: `${m.wins[0]}-${m.wins[1]}`,
      winner: getTeam(m.winner)?.name || null,
      scheduledTime: m.scheduledTime || null,
    })),
  });
}
