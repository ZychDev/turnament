import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readMvpVotes, writeMvpVotes } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

const checkLimit = rateLimit(30, 60_000);

export const dynamic = 'force-dynamic';

export async function GET() {
  const votes = await readMvpVotes();
  return Response.json(votes, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req) {
  const { success } = checkLimit(req);
  if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { matchId, playerName } = body;

  if (!matchId || !playerName) {
    return Response.json({ error: 'matchId and playerName required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieName = `mvp_${matchId}`;

  if (cookieStore.get(cookieName)) {
    return Response.json({ error: 'Already voted' }, { status: 403 });
  }

  const votes = await readMvpVotes();
  if (!votes[matchId]) votes[matchId] = {};
  votes[matchId][playerName] = (votes[matchId][playerName] || 0) + 1;

  await writeMvpVotes(votes);

  const response = NextResponse.json({ ok: true, votes: votes[matchId] });
  response.cookies.set(cookieName, '1', { maxAge: 60 * 60 * 24 * 7, path: '/' });
  return response;
}
