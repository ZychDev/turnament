const { applyMatchResult, getAllMatches, getRoundForMatch } = require('../lib/bracket');

// Helper: create a fresh empty bracket
function createEmptyBracket() {
  return {
    winners: [
      { name: 'WB Runda 1', bestOf: 1, matches: [
        { id: 'wb-r1-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r1-m2', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r1-m3', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r1-m4', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'WB Runda 2', bestOf: 1, matches: [
        { id: 'wb-r2-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r2-m2', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'WB Runda 3', bestOf: 3, matches: [
        { id: 'wb-r3-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
    ],
    losers: [
      { name: 'LB Runda 1', bestOf: 1, matches: [
        { id: 'lb-r1-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'lb-r1-m2', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'LB Runda 2', bestOf: 1, matches: [
        { id: 'lb-r2-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'lb-r2-m2', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'LB Runda 3', bestOf: 3, matches: [
        { id: 'lb-r3-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'LB Final', bestOf: 3, matches: [
        { id: 'lb-final-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
    ],
    grandFinal: { name: 'Grand Final', bestOf: 5, matches: [
      { id: 'gf-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
    ]},
  };
}

// Helper: seed 8 teams into WB R1
function seedBracket(bracket) {
  const b = JSON.parse(JSON.stringify(bracket));
  b.winners[0].matches[0].t1 = 'teamA';
  b.winners[0].matches[0].t2 = 'teamB';
  b.winners[0].matches[1].t1 = 'teamC';
  b.winners[0].matches[1].t2 = 'teamD';
  b.winners[0].matches[2].t1 = 'teamE';
  b.winners[0].matches[2].t2 = 'teamF';
  b.winners[0].matches[3].t1 = 'teamG';
  b.winners[0].matches[3].t2 = 'teamH';
  return b;
}

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

describe('Bracket - applyMatchResult', () => {
  let bracket;

  beforeEach(() => {
    bracket = seedBracket(createEmptyBracket());
  });

  test('should set winner and wins correctly', () => {
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA',
    });
    const match = findMatch(result, 'wb-r1-m1');
    expect(match.winner).toBe('teamA');
    expect(match.wins).toEqual([1, 0]);
  });

  test('should auto-set status to finished when winner is set', () => {
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA',
    });
    const match = findMatch(result, 'wb-r1-m1');
    expect(match.status).toBe('finished');
  });

  test('should propagate winner to next WB round', () => {
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA',
    });
    // teamA should be in WB R2 M1 slot 1
    const nextMatch = findMatch(result, 'wb-r2-m1');
    expect(nextMatch.t1).toBe('teamA');
  });

  test('should propagate loser to losers bracket', () => {
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA',
    });
    // teamB (loser) should be in LB R1 M1 slot 1
    const lbMatch = findMatch(result, 'lb-r1-m1');
    expect(lbMatch.t1).toBe('teamB');
  });

  test('should propagate WB R1 M4 loser to LB R1 M1 slot 2', () => {
    const result = applyMatchResult(bracket, 'wb-r1-m4', {
      wins: [0, 1], winner: 'teamH',
    });
    const lbMatch = findMatch(result, 'lb-r1-m1');
    expect(lbMatch.t2).toBe('teamG');
  });

  test('should handle full WB R1 → WB R2 propagation', () => {
    let b = bracket;
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r1-m2', { wins: [1, 0], winner: 'teamC' });

    const wbR2 = findMatch(b, 'wb-r2-m1');
    expect(wbR2.t1).toBe('teamA');
    expect(wbR2.t2).toBe('teamC');
  });

  test('should propagate through entire winners bracket to grand final', () => {
    let b = bracket;
    // WB R1
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r1-m2', { wins: [1, 0], winner: 'teamC' });
    b = applyMatchResult(b, 'wb-r1-m3', { wins: [1, 0], winner: 'teamE' });
    b = applyMatchResult(b, 'wb-r1-m4', { wins: [1, 0], winner: 'teamG' });
    // WB R2
    b = applyMatchResult(b, 'wb-r2-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r2-m2', { wins: [1, 0], winner: 'teamE' });
    // WB R3
    b = applyMatchResult(b, 'wb-r3-m1', { wins: [2, 0], winner: 'teamA' });

    const gf = findMatch(b, 'gf-m1');
    expect(gf.t1).toBe('teamA'); // WB winner
  });

  test('should propagate through losers bracket to grand final', () => {
    let b = bracket;
    // WB R1 - all matches
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r1-m2', { wins: [1, 0], winner: 'teamC' });
    b = applyMatchResult(b, 'wb-r1-m3', { wins: [1, 0], winner: 'teamE' });
    b = applyMatchResult(b, 'wb-r1-m4', { wins: [1, 0], winner: 'teamG' });
    // WB R2
    b = applyMatchResult(b, 'wb-r2-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r2-m2', { wins: [1, 0], winner: 'teamE' });
    // WB R3
    b = applyMatchResult(b, 'wb-r3-m1', { wins: [2, 0], winner: 'teamA' });

    // LB R1
    b = applyMatchResult(b, 'lb-r1-m1', { wins: [1, 0], winner: 'teamB' });
    b = applyMatchResult(b, 'lb-r1-m2', { wins: [1, 0], winner: 'teamD' });
    // LB R2
    b = applyMatchResult(b, 'lb-r2-m1', { wins: [1, 0], winner: 'teamB' });
    b = applyMatchResult(b, 'lb-r2-m2', { wins: [1, 0], winner: 'teamD' });
    // LB R3
    b = applyMatchResult(b, 'lb-r3-m1', { wins: [2, 0], winner: 'teamB' });
    // LB Final
    b = applyMatchResult(b, 'lb-final-m1', { wins: [2, 0], winner: 'teamB' });

    const gf = findMatch(b, 'gf-m1');
    expect(gf.t1).toBe('teamA'); // WB winner
    expect(gf.t2).toBe('teamB'); // LB winner
  });

  test('should cascade clear when winner changes', () => {
    let b = bracket;
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r1-m2', { wins: [1, 0], winner: 'teamC' });
    // WB R2 now has teamA vs teamC
    b = applyMatchResult(b, 'wb-r2-m1', { wins: [1, 0], winner: 'teamA' });

    // Now change WB R1 M1 winner to teamB
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [0, 1], winner: 'teamB' });

    // WB R2 M1 should have teamB in slot 1, and previous result should be cleared
    const wbR2 = findMatch(b, 'wb-r2-m1');
    expect(wbR2.t1).toBe('teamB');
    expect(wbR2.winner).toBeNull(); // result was cleared
    expect(wbR2.wins).toEqual([0, 0]);
  });

  test('should cascade clear loser path when winner changes', () => {
    let b = bracket;
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    // teamB goes to LB
    const lb1 = findMatch(b, 'lb-r1-m1');
    expect(lb1.t1).toBe('teamB');

    // Change winner
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [0, 1], winner: 'teamB' });
    // Now teamA is in LB, teamB is NOT in LB anymore
    const lb1After = findMatch(b, 'lb-r1-m1');
    expect(lb1After.t1).toBe('teamA');
  });

  test('should not crash on non-existent match ID', () => {
    const result = applyMatchResult(bracket, 'invalid-match', {
      wins: [1, 0], winner: 'teamA',
    });
    // Should return unchanged bracket
    expect(result).toEqual(bracket);
  });

  test('should set stream URL', () => {
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [0, 0], streamUrl: 'https://twitch.tv/test',
    });
    const match = findMatch(result, 'wb-r1-m1');
    expect(match.streamUrl).toBe('https://twitch.tv/test');
  });

  test('should set LIVE status and liveStartTime', () => {
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [0, 0], status: 'live',
    });
    const match = findMatch(result, 'wb-r1-m1');
    expect(match.status).toBe('live');
    expect(match.liveStartTime).toBeTruthy();
  });

  test('should clear liveStartTime when status changes from live', () => {
    let b = applyMatchResult(bracket, 'wb-r1-m1', { wins: [0, 0], status: 'live' });
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    const match = findMatch(b, 'wb-r1-m1');
    expect(match.status).toBe('finished');
    expect(match.liveStartTime).toBeNull();
  });

  test('should preserve existing match data when updating partially', () => {
    let b = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [0, 0], status: 'live', comment: 'Test comment',
    });
    b = applyMatchResult(b, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA',
    });
    const match = findMatch(b, 'wb-r1-m1');
    expect(match.comment).toBe('Test comment'); // preserved
    expect(match.winner).toBe('teamA');
  });

  test('should store game stats', () => {
    const games = [{ players: [
      { teamId: 'teamA', role: 'Top', kills: 5, deaths: 2, assists: 3, cs: 200 },
    ]}];
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA', games,
    });
    const match = findMatch(result, 'wb-r1-m1');
    expect(match.games).toHaveLength(1);
    expect(match.games[0].players[0].kills).toBe(5);
  });
});

describe('Bracket - getAllMatches', () => {
  test('should return all 14 matches in double elimination', () => {
    const bracket = createEmptyBracket();
    const matches = getAllMatches(bracket);
    // 4 WB R1 + 2 WB R2 + 1 WB R3 + 2 LB R1 + 2 LB R2 + 1 LB R3 + 1 LB Final + 1 GF = 14
    expect(matches).toHaveLength(14);
  });

  test('should include round name and bestOf', () => {
    const bracket = createEmptyBracket();
    const matches = getAllMatches(bracket);
    const wbR1 = matches.filter(m => m.roundName === 'WB Runda 1');
    expect(wbR1).toHaveLength(4);
    expect(wbR1[0].bestOf).toBe(1);
  });

  test('should always have wins and games defaults', () => {
    const bracket = {
      winners: [{ name: 'R1', bestOf: 1, matches: [
        { id: 'test', t1: null, t2: null }, // no wins/games
      ]}],
      losers: [],
    };
    const matches = getAllMatches(bracket);
    expect(matches[0].wins).toEqual([0, 0]);
    expect(matches[0].games).toEqual([]);
  });

  test('should include grand final', () => {
    const bracket = createEmptyBracket();
    const matches = getAllMatches(bracket);
    const gf = matches.find(m => m.id === 'gf-m1');
    expect(gf).toBeTruthy();
    expect(gf.bestOf).toBe(5);
  });
});

describe('Bracket - getRoundForMatch', () => {
  test('should find WB round', () => {
    const bracket = createEmptyBracket();
    const round = getRoundForMatch(bracket, 'wb-r1-m1');
    expect(round.name).toBe('WB Runda 1');
  });

  test('should find LB round', () => {
    const bracket = createEmptyBracket();
    const round = getRoundForMatch(bracket, 'lb-r1-m1');
    expect(round.name).toBe('LB Runda 1');
  });

  test('should find grand final', () => {
    const bracket = createEmptyBracket();
    const round = getRoundForMatch(bracket, 'gf-m1');
    expect(round.name).toBe('Grand Final');
  });

  test('should return null for non-existent match', () => {
    const bracket = createEmptyBracket();
    const round = getRoundForMatch(bracket, 'fake-match');
    expect(round).toBeNull();
  });
});

describe('Bracket - edge cases', () => {
  test('should handle setting winner without wins array', () => {
    const bracket = seedBracket(createEmptyBracket());
    // Should not crash even if wins is undefined
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      winner: 'teamA',
    });
    const match = findMatch(result, 'wb-r1-m1');
    expect(match.winner).toBe('teamA');
    expect(match.status).toBe('finished');
  });

  test('should handle empty bracket gracefully', () => {
    const empty = { winners: [], losers: [] };
    const matches = getAllMatches(empty);
    expect(matches).toEqual([]);
  });

  test('should handle bracket without grandFinal', () => {
    const noGF = { winners: [{ name: 'R1', bestOf: 1, matches: [
      { id: 'test', t1: 'a', t2: 'b', wins: [0,0] }
    ]}], losers: [] };
    const matches = getAllMatches(noGF);
    expect(matches).toHaveLength(1);
  });

  test('full tournament simulation - no crashes', () => {
    let b = seedBracket(createEmptyBracket());

    // WB R1
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r1-m2', { wins: [0, 1], winner: 'teamD' });
    b = applyMatchResult(b, 'wb-r1-m3', { wins: [1, 0], winner: 'teamE' });
    b = applyMatchResult(b, 'wb-r1-m4', { wins: [0, 1], winner: 'teamH' });

    // WB R2
    b = applyMatchResult(b, 'wb-r2-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r2-m2', { wins: [0, 1], winner: 'teamH' });

    // WB R3
    b = applyMatchResult(b, 'wb-r3-m1', { wins: [2, 1], winner: 'teamA' });

    // LB R1
    b = applyMatchResult(b, 'lb-r1-m1', { wins: [1, 0], winner: 'teamB' });
    b = applyMatchResult(b, 'lb-r1-m2', { wins: [0, 1], winner: 'teamF' });

    // LB R2
    b = applyMatchResult(b, 'lb-r2-m1', { wins: [1, 0], winner: 'teamB' });
    b = applyMatchResult(b, 'lb-r2-m2', { wins: [1, 0], winner: 'teamF' });

    // LB R3
    b = applyMatchResult(b, 'lb-r3-m1', { wins: [2, 0], winner: 'teamB' });

    // LB Final
    b = applyMatchResult(b, 'lb-final-m1', { wins: [2, 1], winner: 'teamB' });

    // Grand Final
    b = applyMatchResult(b, 'gf-m1', { wins: [3, 2], winner: 'teamA' });

    const gf = findMatch(b, 'gf-m1');
    expect(gf.winner).toBe('teamA');
    expect(gf.t1).toBe('teamA');
    expect(gf.t2).toBe('teamB');

    // All 14 matches should be finished
    const allMatches = getAllMatches(b);
    const finished = allMatches.filter(m => m.status === 'finished');
    expect(finished).toHaveLength(14);
  });
});
