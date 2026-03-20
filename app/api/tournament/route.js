import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { config, teams, bracket } = await readDb();
  return Response.json({ tournamentName: config.tournamentName, rules: config.rules || '', teams, bracket }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
