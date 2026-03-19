import fs from 'fs';
import path from 'path';
import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

const PREDICTIONS_PATH = path.join(process.cwd(), 'predictions.json');

function resetMatches(rounds, isWinners) {
  if (!rounds) return;

  const roundsArray = Array.isArray(rounds) ? rounds : [rounds];

  for (const round of roundsArray) {
    for (const match of round.matches) {
      const isWbR1 = round.id === 'wb-r1';

      if (!isWbR1) {
        match.t1 = null;
        match.t2 = null;
      }

      match.wins = [0, 0];
      match.winner = null;
      match.games = [];
      match.status = '';
      match.scheduledTime = '';
      match.liveStartTime = null;
    }
  }
}

export async function PUT(req) {
  if (!checkAuth(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = readDb();

  // Reset winners bracket
  resetMatches(db.bracket.winners, true);

  // Reset losers bracket
  resetMatches(db.bracket.losers, false);

  // Reset grand final
  if (db.bracket.grandFinal) {
    resetMatches([db.bracket.grandFinal], false);
  }

  writeDbWithHistory(db);
  bumpVersion();

  // Clear predictions
  try { fs.writeFileSync(PREDICTIONS_PATH, JSON.stringify({}, null, 2)); } catch (e) {}

  return Response.json({ ok: true });
}
