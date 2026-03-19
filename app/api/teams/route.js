import { readDb } from '@/lib/db';

export async function GET() {
  const { teams } = readDb();
  return Response.json(teams);
}
