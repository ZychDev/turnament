// Double elimination bracket propagation map
// Each entry: matchId -> { winTo: [matchId, slot], loseTo: [matchId, slot] }
const PROPAGATION = {
  // Winners Bracket Round 1 -> WB R2 (winners) + LB R1 (losers)
  'wb-r1-m1': { winTo: ['wb-r2-m1', 1], loseTo: ['lb-r1-m1', 1] },
  'wb-r1-m2': { winTo: ['wb-r2-m1', 2], loseTo: ['lb-r1-m2', 1] },
  'wb-r1-m3': { winTo: ['wb-r2-m2', 1], loseTo: ['lb-r1-m2', 2] },
  'wb-r1-m4': { winTo: ['wb-r2-m2', 2], loseTo: ['lb-r1-m1', 2] },

  // Winners Bracket Round 2 -> WB R3 (winners) + LB R2 (losers)
  'wb-r2-m1': { winTo: ['wb-r3-m1', 1], loseTo: ['lb-r2-m1', 2] },
  'wb-r2-m2': { winTo: ['wb-r3-m1', 2], loseTo: ['lb-r2-m2', 2] },

  // Winners Bracket Round 3 -> Grand Final (winner) + LB Final (loser)
  'wb-r3-m1': { winTo: ['gf-m1', 1], loseTo: ['lb-final-m1', 2] },

  // Losers Bracket Round 1 -> LB R2
  'lb-r1-m1': { winTo: ['lb-r2-m1', 1], loseTo: null },
  'lb-r1-m2': { winTo: ['lb-r2-m2', 1], loseTo: null },

  // Losers Bracket Round 2 -> LB R3
  'lb-r2-m1': { winTo: ['lb-r3-m1', 1], loseTo: null },
  'lb-r2-m2': { winTo: ['lb-r3-m1', 2], loseTo: null },

  // Losers Bracket Round 3 -> LB Final
  'lb-r3-m1': { winTo: ['lb-final-m1', 1], loseTo: null },

  // LB Final -> Grand Final
  'lb-final-m1': { winTo: ['gf-m1', 2], loseTo: null },

  // Grand Final -> no propagation
  'gf-m1': { winTo: null, loseTo: null },
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
  if (bracket.grandFinal) {
    for (const match of bracket.grandFinal.matches) {
      if (match.id === matchId) return match;
    }
  }
  return null;
}

function setSlot(match, slot, teamId) {
  if (slot === 1) match.t1 = teamId;
  if (slot === 2) match.t2 = teamId;
}

function clearSlot(match, slot, teamId) {
  if (slot === 1 && match.t1 === teamId) match.t1 = null;
  if (slot === 2 && match.t2 === teamId) match.t2 = null;
}

export function applyMatchResult(bracket, matchId, { wins, winner, scheduledTime, games, status, comment, mvp, streamUrl }) {
  const brk = JSON.parse(JSON.stringify(bracket));
  const match = findMatch(brk, matchId);
  if (!match) return brk;

  const oldWinner = match.winner;
  const prop = PROPAGATION[matchId];

  // Clear old propagation if winner changed
  if (oldWinner && oldWinner !== winner && prop) {
    if (prop.winTo) {
      const target = findMatch(brk, prop.winTo[0]);
      if (target) clearSlot(target, prop.winTo[1], oldWinner);
    }
    // Also clear loser propagation
    const oldLoser = oldWinner === match.t1 ? match.t2 : match.t1;
    if (oldLoser && prop.loseTo) {
      const target = findMatch(brk, prop.loseTo[0]);
      if (target) clearSlot(target, prop.loseTo[1], oldLoser);
    }
  }

  // Save new data
  match.wins = wins;
  match.winner = winner;
  if (scheduledTime !== undefined) match.scheduledTime = scheduledTime;
  if (games !== undefined) match.games = games;
  if (streamUrl !== undefined) match.streamUrl = streamUrl;
  if (status !== undefined) {
    match.status = status;
    if (status === 'live' && !match.liveStartTime) match.liveStartTime = new Date().toISOString();
    if (status !== 'live') match.liveStartTime = null;
  }
  // Auto-set status to 'finished' when a winner is determined
  if (winner && match.status !== 'finished') {
    match.status = 'finished';
    match.liveStartTime = null;
  }
  if (comment !== undefined) match.comment = comment;
  if (mvp !== undefined) match.mvp = mvp;

  // Propagate new results
  if (winner && prop) {
    const loser = winner === match.t1 ? match.t2 : match.t1;

    if (prop.winTo) {
      const target = findMatch(brk, prop.winTo[0]);
      if (target) setSlot(target, prop.winTo[1], winner);
    }
    if (loser && prop.loseTo) {
      const target = findMatch(brk, prop.loseTo[0]);
      if (target) setSlot(target, prop.loseTo[1], loser);
    }
  }

  return brk;
}

export function getAllMatches(bracket) {
  const matches = [];
  for (const section of ['winners', 'losers']) {
    if (bracket[section]) {
      for (const round of bracket[section]) {
        for (const match of round.matches) {
          matches.push({ ...match, roundName: round.name, bestOf: round.bestOf });
        }
      }
    }
  }
  if (bracket.grandFinal) {
    for (const match of bracket.grandFinal.matches) {
      matches.push({ ...match, roundName: bracket.grandFinal.name, bestOf: bracket.grandFinal.bestOf });
    }
  }
  return matches;
}

export function getRoundForMatch(bracket, matchId) {
  for (const section of ['winners', 'losers']) {
    if (bracket[section]) {
      for (const round of bracket[section]) {
        if (round.matches.some(m => m.id === matchId)) return round;
      }
    }
  }
  if (bracket.grandFinal && bracket.grandFinal.matches.some(m => m.id === matchId)) {
    return bracket.grandFinal;
  }
  return null;
}
