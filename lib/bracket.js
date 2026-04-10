// Double elimination bracket propagation map
// Each entry: matchId -> { winTo: [matchId, slot], loseTo: [matchId, slot] }
const PROPAGATION = {
  // Winners Bracket Round 1 -> WB R2 (winners) + LB R1 (losers)
  // LB R1 M1 contains bottom-half losers (m3, m4); LB R1 M2 contains top-half losers (m1, m2)
  // This ensures LB R1 winners have a known WB origin half, allowing LB R2 to cross-pair them
  // with WB R2 losers from the OPPOSITE half (preventing rematches).
  'wb-r1-m1': { winTo: ['wb-r2-m1', 1], loseTo: ['lb-r1-m2', 2] },
  'wb-r1-m2': { winTo: ['wb-r2-m1', 2], loseTo: ['lb-r1-m2', 1] },
  'wb-r1-m3': { winTo: ['wb-r2-m2', 1], loseTo: ['lb-r1-m1', 1] },
  'wb-r1-m4': { winTo: ['wb-r2-m2', 2], loseTo: ['lb-r1-m1', 2] },

  // Winners Bracket Round 2 -> WB R3 (winners) + LB R2 (losers)
  // wb-r2-m1 (top half match) loser drops to LB R2 M1 where bottom-half LB R1 winner waits
  // wb-r2-m2 (bottom half match) loser drops to LB R2 M2 where top-half LB R1 winner waits
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

  // Clear old propagation if winner changed — cascade downstream
  if (oldWinner && oldWinner !== winner && prop) {
    const cascadeClear = (matchId, teamId) => {
      const p = PROPAGATION[matchId];
      if (!p) return;
      if (p.winTo) {
        const target = findMatch(brk, p.winTo[0]);
        if (target && (target.t1 === teamId || target.t2 === teamId)) {
          // If this downstream match has a result depending on our team, clear it too
          if (target.winner) {
            const downLoser = target.winner === target.t1 ? target.t2 : target.t1;
            cascadeClear(p.winTo[0], target.winner);
            if (downLoser) {
              const dp = PROPAGATION[p.winTo[0]];
              if (dp?.loseTo) {
                const lt = findMatch(brk, dp.loseTo[0]);
                if (lt) clearSlot(lt, dp.loseTo[1], downLoser);
              }
            }
            target.winner = null;
            target.wins = [0, 0];
            target.games = [];
            target.status = '';
            target.mvp = '';
            target.comment = '';
            target.streamUrl = '';
          }
          clearSlot(target, p.winTo[1], teamId);
        }
      }
    };
    // Cascade clear winner path
    cascadeClear(matchId, oldWinner);
    if (prop.winTo) {
      const target = findMatch(brk, prop.winTo[0]);
      if (target) clearSlot(target, prop.winTo[1], oldWinner);
    }
    // Clear loser propagation
    const oldLoser = oldWinner === match.t1 ? match.t2 : match.t1;
    if (oldLoser && prop.loseTo) {
      const target = findMatch(brk, prop.loseTo[0]);
      if (target) {
        cascadeClear(prop.loseTo[0], oldLoser);
        clearSlot(target, prop.loseTo[1], oldLoser);
      }
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
  const push = (m, roundName, bestOf) => {
    matches.push({ wins: [0, 0], games: [], ...m, roundName, bestOf });
  };
  for (const section of ['winners', 'losers']) {
    if (bracket[section]) {
      for (const round of bracket[section]) {
        for (const match of round.matches) push(match, round.name, round.bestOf);
      }
    }
  }
  if (bracket.grandFinal) {
    for (const match of bracket.grandFinal.matches) push(match, bracket.grandFinal.name, bracket.grandFinal.bestOf);
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
