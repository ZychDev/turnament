import { readDb, writeDbWithHistory, bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

// One-time migration: reorganize the losers bracket so that
// LB R1 pairs WB R1 losers from the same half (top with top, bottom with bottom).
// This matches the new propagation in lib/bracket.js.
//
// New mapping:
//   wb-r1-m1 loser -> lb-r1-m2 slot 2 (top half)
//   wb-r1-m2 loser -> lb-r1-m2 slot 1 (top half)
//   wb-r1-m3 loser -> lb-r1-m1 slot 1 (bottom half)
//   wb-r1-m4 loser -> lb-r1-m1 slot 2 (bottom half)
//   wb-r2-m1 loser -> lb-r2-m1 slot 2
//   wb-r2-m2 loser -> lb-r2-m2 slot 2
//
// LB R1 winners (if any) propagate to LB R2 slot 1 of the matching match number.

const LB_R1_SLOTS = {
  'wb-r1-m1': ['lb-r1-m2', 2],
  'wb-r1-m2': ['lb-r1-m2', 1],
  'wb-r1-m3': ['lb-r1-m1', 1],
  'wb-r1-m4': ['lb-r1-m1', 2],
};
const LB_R2_SLOTS = {
  'wb-r2-m1': ['lb-r2-m1', 2],
  'wb-r2-m2': ['lb-r2-m2', 2],
};

function findMatch(bracket, matchId) {
  for (const section of ['winners', 'losers']) {
    if (bracket[section]) {
      for (const round of bracket[section]) {
        for (const match of round.matches) {
          if (match.id === matchId) return match;
        }
      }
    }
  }
  return null;
}

function setSlot(match, slot, teamId) {
  if (slot === 1) match.t1 = teamId;
  if (slot === 2) match.t2 = teamId;
}

function clearMatchTeams(match) {
  match.t1 = null;
  match.t2 = null;
  match.wins = [0, 0];
  match.winner = null;
  match.games = [];
  match.status = '';
  match.mvp = '';
  match.comment = '';
  match.streamUrl = '';
  match.liveStartTime = null;
}

export async function POST(req) {
  if (!await checkAuth(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await readDb();
  const bracket = db.bracket;

  // Step 1: Clear all LB matches (we'll rebuild from WB state)
  if (bracket.losers) {
    for (const round of bracket.losers) {
      for (const match of round.matches) {
        clearMatchTeams(match);
      }
    }
  }

  const moves = [];

  // Step 2: Place WB R1 losers into LB R1 per new propagation
  for (const [wbMatchId, [lbMatchId, slot]] of Object.entries(LB_R1_SLOTS)) {
    const wbMatch = findMatch(bracket, wbMatchId);
    if (!wbMatch || !wbMatch.winner) continue;
    const loser = wbMatch.winner === wbMatch.t1 ? wbMatch.t2 : wbMatch.t1;
    if (!loser) continue;
    const lbMatch = findMatch(bracket, lbMatchId);
    if (lbMatch) {
      setSlot(lbMatch, slot, loser);
      moves.push(`${wbMatchId} loser -> ${lbMatchId} slot ${slot}`);
    }
  }

  // Step 3: Place WB R2 losers into LB R2 per new propagation
  for (const [wbMatchId, [lbMatchId, slot]] of Object.entries(LB_R2_SLOTS)) {
    const wbMatch = findMatch(bracket, wbMatchId);
    if (!wbMatch || !wbMatch.winner) continue;
    const loser = wbMatch.winner === wbMatch.t1 ? wbMatch.t2 : wbMatch.t1;
    if (!loser) continue;
    const lbMatch = findMatch(bracket, lbMatchId);
    if (lbMatch) {
      setSlot(lbMatch, slot, loser);
      moves.push(`${wbMatchId} loser -> ${lbMatchId} slot ${slot}`);
    }
  }

  // Step 4: WB R3 loser still goes to lb-final-m1 slot 2 (unchanged)
  const wbR3 = findMatch(bracket, 'wb-r3-m1');
  if (wbR3 && wbR3.winner) {
    const loser = wbR3.winner === wbR3.t1 ? wbR3.t2 : wbR3.t1;
    if (loser) {
      const lbFinal = findMatch(bracket, 'lb-final-m1');
      if (lbFinal) {
        setSlot(lbFinal, 2, loser);
        moves.push(`wb-r3-m1 loser -> lb-final-m1 slot 2`);
      }
    }
  }

  await writeDbWithHistory(db);
  bumpVersion();

  return Response.json({
    ok: true,
    message: 'Losers bracket rebuilt from current WB state. LB R1+ results were cleared and need to be re-entered if any.',
    moves,
  });
}
