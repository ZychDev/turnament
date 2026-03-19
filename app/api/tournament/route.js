import { readDb } from '@/lib/db';

export async function GET() {
  const { config, teams, bracket } = readDb();
  return Response.json({ tournamentName: config.tournamentName, teams, bracket });
}
