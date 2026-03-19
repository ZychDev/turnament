import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readPredictions, writePredictions } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

const checkLimit = rateLimit(30, 60_000);

export async function GET() {
  const predictions = await readPredictions();
  return Response.json(predictions, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req) {
  const { success } = checkLimit(req);
  if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { matchId, teamId } = body;

  if (!matchId || !teamId) {
    return Response.json({ error: 'matchId and teamId are required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieName = `voted_${matchId}`;

  if (cookieStore.get(cookieName)) {
    return Response.json({ error: 'Already voted for this match' }, { status: 403 });
  }

  const predictions = await readPredictions();

  if (!predictions[matchId]) {
    predictions[matchId] = {};
  }
  predictions[matchId][teamId] = (predictions[matchId][teamId] || 0) + 1;

  await writePredictions(predictions);

  const response = NextResponse.json({ ok: true, predictions });
  response.cookies.set(cookieName, '1', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    httpOnly: true,
  });

  return response;
}
