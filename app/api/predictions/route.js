import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const PREDICTIONS_PATH = path.join(process.cwd(), 'predictions.json');

function readPredictions() {
  try {
    return JSON.parse(fs.readFileSync(PREDICTIONS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writePredictions(data) {
  fs.writeFileSync(PREDICTIONS_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const predictions = readPredictions();
  return Response.json(predictions);
}

export async function POST(req) {
  const { matchId, teamId } = await req.json();

  if (!matchId || !teamId) {
    return Response.json({ error: 'matchId and teamId are required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieName = `voted_${matchId}`;

  if (cookieStore.get(cookieName)) {
    return Response.json({ error: 'Already voted for this match' }, { status: 403 });
  }

  const predictions = readPredictions();

  if (!predictions[matchId]) {
    predictions[matchId] = {};
  }
  predictions[matchId][teamId] = (predictions[matchId][teamId] || 0) + 1;

  writePredictions(predictions);

  const response = Response.json({ ok: true, predictions });
  cookieStore.set(cookieName, '1', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    httpOnly: true,
  });

  return response;
}
