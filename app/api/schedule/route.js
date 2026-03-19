import { readDb } from '@/lib/db';
import { getAllMatches } from '@/lib/bracket';

export async function GET() {
  const { teams, bracket } = readDb();
  const matches = getAllMatches(bracket)
    .map(m => ({
      ...m,
      team1: teams.find(t => t.id === m.t1) || null,
      team2: teams.find(t => t.id === m.t2) || null,
      status: m.winner ? 'finished' : (m.t1 && m.t2 ? 'ready' : 'tbd'),
    }))
    .sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) return a.scheduledTime.localeCompare(b.scheduledTime);
      if (a.scheduledTime) return -1;
      if (b.scheduledTime) return 1;
      return 0;
    });
  return Response.json(matches);
}
