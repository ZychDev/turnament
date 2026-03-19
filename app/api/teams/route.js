import { readDb } from '@/lib/db';

export async function GET() {
  const { teams } = await readDb();
  return Response.json(teams);
}
