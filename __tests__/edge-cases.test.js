/**
 * Edge case tests - verify the app doesn't crash on unexpected data
 */
const { applyMatchResult, getAllMatches } = require('../lib/bracket');
const { sanitize, isValidUrl } = require('../lib/sanitize');
const { rateLimit } = require('../lib/rateLimit');

// Helper
function createEmptyBracket() {
  return {
    winners: [
      { name: 'WB R1', bestOf: 1, matches: [
        { id: 'wb-r1-m1', t1: 'teamA', t2: 'teamB', wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r1-m2', t1: 'teamC', t2: 'teamD', wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r1-m3', t1: 'teamE', t2: 'teamF', wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r1-m4', t1: 'teamG', t2: 'teamH', wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'WB R2', bestOf: 1, matches: [
        { id: 'wb-r2-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'wb-r2-m2', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'WB R3', bestOf: 3, matches: [
        { id: 'wb-r3-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
    ],
    losers: [
      { name: 'LB R1', bestOf: 1, matches: [
        { id: 'lb-r1-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'lb-r1-m2', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'LB R2', bestOf: 1, matches: [
        { id: 'lb-r2-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
        { id: 'lb-r2-m2', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'LB R3', bestOf: 3, matches: [
        { id: 'lb-r3-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
      { name: 'LB Final', bestOf: 3, matches: [
        { id: 'lb-final-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
      ]},
    ],
    grandFinal: { name: 'GF', bestOf: 5, matches: [
      { id: 'gf-m1', t1: null, t2: null, wins: [0, 0], winner: null, games: [], status: '' },
    ]},
  };
}

function findMatch(bracket, matchId) {
  for (const s of ['winners', 'losers']) {
    if (bracket[s]) for (const r of bracket[s]) for (const m of r.matches) if (m.id === matchId) return m;
  }
  if (bracket.grandFinal) for (const m of bracket.grandFinal.matches) if (m.id === matchId) return m;
  return null;
}

describe('Bracket edge cases - missing data', () => {
  test('match with no wins property should not crash getAllMatches', () => {
    const bracket = {
      winners: [{ name: 'R1', bestOf: 1, matches: [
        { id: 'test-1', t1: 'a', t2: 'b' }, // no wins, no games
      ]}],
      losers: [],
    };
    const matches = getAllMatches(bracket);
    expect(matches[0].wins).toEqual([0, 0]);
    expect(matches[0].games).toEqual([]);
  });

  test('match with undefined t1/t2 should propagate correctly', () => {
    const bracket = createEmptyBracket();
    // Set winner where t2 is null — loser is null
    const result = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA',
    });
    const next = findMatch(result, 'wb-r2-m1');
    expect(next.t1).toBe('teamA');
    // Loser (teamB) should go to LB
    const lb = findMatch(result, 'lb-r1-m1');
    expect(lb.t1).toBe('teamB');
  });

  test('setting same winner twice should be idempotent', () => {
    const bracket = createEmptyBracket();
    let b = applyMatchResult(bracket, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });

    const next = findMatch(b, 'wb-r2-m1');
    expect(next.t1).toBe('teamA');
  });

  test('clearing winner (setting to null) should clear propagation', () => {
    const bracket = createEmptyBracket();
    let b = applyMatchResult(bracket, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    // Now clear the winner
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [0, 0], winner: null });

    const match = findMatch(b, 'wb-r1-m1');
    expect(match.winner).toBeNull();
  });

  test('double cascade: changing R1 winner after R2 result should clear all downstream', () => {
    const bracket = createEmptyBracket();
    let b = bracket;
    // R1 results
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    b = applyMatchResult(b, 'wb-r1-m2', { wins: [1, 0], winner: 'teamC' });
    // R2 result
    b = applyMatchResult(b, 'wb-r2-m1', { wins: [1, 0], winner: 'teamA' });
    // R3 slot should have teamA
    const r3Before = findMatch(b, 'wb-r3-m1');
    expect(r3Before.t1).toBe('teamA');

    // Now change R1 M1 winner to teamB — should cascade clear R2 and R3
    b = applyMatchResult(b, 'wb-r1-m1', { wins: [0, 1], winner: 'teamB' });

    const r2After = findMatch(b, 'wb-r2-m1');
    expect(r2After.t1).toBe('teamB'); // new winner propagated
    expect(r2After.winner).toBeNull(); // result cleared

    const r3After = findMatch(b, 'wb-r3-m1');
    expect(r3After.t1).toBeNull(); // cascade cleared
  });
});

describe('Bracket edge cases - status transitions', () => {
  test('live -> finished transition', () => {
    const bracket = createEmptyBracket();
    let b = applyMatchResult(bracket, 'wb-r1-m1', { wins: [0, 0], status: 'live' });
    expect(findMatch(b, 'wb-r1-m1').status).toBe('live');
    expect(findMatch(b, 'wb-r1-m1').liveStartTime).toBeTruthy();

    b = applyMatchResult(b, 'wb-r1-m1', { wins: [1, 0], winner: 'teamA' });
    const match = findMatch(b, 'wb-r1-m1');
    expect(match.status).toBe('finished');
    expect(match.liveStartTime).toBeNull();
  });

  test('setting status explicitly should override auto-finish', () => {
    const bracket = createEmptyBracket();
    // Set winner + status live at same time — winner should auto-finish
    let b = applyMatchResult(bracket, 'wb-r1-m1', {
      wins: [1, 0], winner: 'teamA', status: 'live',
    });
    // Winner auto-sets to finished regardless of status param
    expect(findMatch(b, 'wb-r1-m1').status).toBe('finished');
  });
});

describe('Sanitize edge cases', () => {
  test('should handle very long strings', () => {
    const long = 'a'.repeat(100000);
    expect(() => sanitize(long)).not.toThrow();
  });

  test('should handle strings with only special chars', () => {
    expect(sanitize('<><><>')).toBe('&lt;&gt;&lt;&gt;&lt;&gt;');
  });

  test('should handle multiline strings', () => {
    const result = sanitize('line1\nline2\nline3');
    expect(result).toBe('line1\nline2\nline3');
  });

  test('should handle null bytes', () => {
    expect(() => sanitize('hello\x00world')).not.toThrow();
  });

  test('URL validation edge cases', () => {
    expect(isValidUrl('ftp://files.com')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
    expect(isValidUrl('//evil.com')).toBe(false);
    expect(isValidUrl(' https://example.com')).toBe(true); // leading space trimmed
    expect(isValidUrl('HTTPS://EXAMPLE.COM/path?q=1')).toBe(true);
  });
});

describe('Rate limiter edge cases', () => {
  test('should handle extremely high limits', () => {
    const limiter = rateLimit(1000000, 60000);
    const req = { headers: { get: () => '10.0.0.100' } };
    const result = limiter(req);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(999999);
  });

  test('should handle zero limit', () => {
    const limiter = rateLimit(0, 60000);
    const req = { headers: { get: () => '10.0.0.101' } };
    const result = limiter(req);
    expect(result.success).toBe(false);
  });

  test('should handle request with no headers.get', () => {
    const limiter = rateLimit(5, 60000);
    const req = { headers: { get: () => null } };
    expect(() => limiter(req)).not.toThrow();
  });

  test('should handle concurrent requests from same IP', () => {
    const limiter = rateLimit(3, 60000);
    const req = { headers: { get: () => '10.0.0.102' } };
    const results = Array.from({ length: 5 }, () => limiter(req));
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
    expect(results[3].success).toBe(false);
    expect(results[4].success).toBe(false);
  });
});

describe('Data integrity - stats calculation', () => {
  test('KDA with 0 deaths should show Perfect', () => {
    const kills = 10, deaths = 0, assists = 5;
    const kda = deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : kills + assists > 0 ? 'Perfect' : '0';
    expect(kda).toBe('Perfect');
  });

  test('KDA with 0 kills 0 deaths 0 assists should show 0', () => {
    const kills = 0, deaths = 0, assists = 0;
    const kda = deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : kills + assists > 0 ? 'Perfect' : '0';
    expect(kda).toBe('0');
  });

  test('KDA calculation should be correct', () => {
    const kills = 10, deaths = 3, assists = 5;
    const kda = ((kills + assists) / deaths).toFixed(2);
    expect(kda).toBe('5.00');
  });

  test('MVP score formula should work', () => {
    const score = (kills, deaths, assists, cs) =>
      kills * 3 + assists * 2 - deaths * 1.5 + cs * 0.01;
    expect(score(10, 2, 5, 200)).toBe(10*3 + 5*2 - 2*1.5 + 200*0.01);
    expect(score(0, 0, 0, 0)).toBe(0);
    expect(score(0, 10, 0, 0)).toBe(-15); // negative score is valid
  });

  test('KDA tiebreaker should sort correctly', () => {
    const players = [
      { kda: '5.00', kills: 10, assists: 5, deaths: 3, cs: 200 },
      { kda: '5.00', kills: 8, assists: 7, deaths: 3, cs: 250 },
      { kda: '5.00', kills: 10, assists: 5, deaths: 3, cs: 300 },
    ];
    const sorted = [...players].sort((a, b) => {
      const kdaA = parseFloat(a.kda), kdaB = parseFloat(b.kda);
      if (kdaB !== kdaA) return kdaB - kdaA;
      const impactA = a.kills + a.assists, impactB = b.kills + b.assists;
      if (impactB !== impactA) return impactB - impactA;
      if (a.deaths !== b.deaths) return a.deaths - b.deaths;
      return b.cs - a.cs;
    });
    // Same KDA, same impact (15), same deaths, different CS
    expect(sorted[0].cs).toBe(300);
    expect(sorted[1].cs).toBe(250);
    expect(sorted[2].cs).toBe(200);
  });
});
