import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { teams } = await readDb();
  return Response.json(teams);
}
