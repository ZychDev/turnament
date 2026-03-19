import { readDb } from '@/lib/db';
import { getAllMatches } from '@/lib/bracket';

export async function GET(req, { params }) {
  const { teams, bracket } = await readDb();
  const team = teams.find(t => t.id === params.id);
  if (!team) return Response.json({ error: 'Not found' }, { status: 404 });

  const allMatches = getAllMatches(bracket);
  const teamMatches = allMatches.filter(m => m.t1 === team.id || m.t2 === team.id);

  let wins = 0, losses = 0;
  for (const m of teamMatches) {
    if (m.winner === team.id) wins++;
    else if (m.winner) losses++;
  }

  return Response.json({ ...team, matches: teamMatches, record: { wins, losses } });
}
