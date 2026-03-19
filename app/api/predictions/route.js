import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readPredictions, writePredictions } from '@/lib/db';

export async function GET() {
  const predictions = await readPredictions();
  return Response.json(predictions);
}

export async function POST(req) {
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
