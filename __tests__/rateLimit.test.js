const { rateLimit } = require('../lib/rateLimit');

// Mock request object
function mockReq(ip = '127.0.0.1') {
  return {
    headers: {
      get: (name) => {
        if (name === 'x-forwarded-for') return ip;
        return null;
      },
    },
  };
}

describe('rateLimit', () => {
  test('should allow requests within limit', () => {
    const limiter = rateLimit(5, 60000);
    const req = mockReq('10.0.0.1');

    for (let i = 0; i < 5; i++) {
      const result = limiter(req);
      expect(result.success).toBe(true);
    }
  });

  test('should block requests over limit', () => {
    const limiter = rateLimit(3, 60000);
    const req = mockReq('10.0.0.2');

    limiter(req); // 1
    limiter(req); // 2
    limiter(req); // 3
    const result = limiter(req); // 4 - should be blocked
    expect(result.success).toBe(false);
  });

  test('should return remaining count', () => {
    const limiter = rateLimit(5, 60000);
    const req = mockReq('10.0.0.3');

    const r1 = limiter(req);
    expect(r1.remaining).toBe(4);

    const r2 = limiter(req);
    expect(r2.remaining).toBe(3);
  });

  test('should track different IPs separately', () => {
    const limiter = rateLimit(2, 60000);
    const req1 = mockReq('10.0.0.4');
    const req2 = mockReq('10.0.0.5');

    limiter(req1);
    limiter(req1);
    const blocked = limiter(req1);
    expect(blocked.success).toBe(false);

    // Different IP should still be allowed
    const allowed = limiter(req2);
    expect(allowed.success).toBe(true);
  });

  test('should handle missing IP gracefully', () => {
    const limiter = rateLimit(5, 60000);
    const req = { headers: { get: () => null } };
    const result = limiter(req);
    expect(result.success).toBe(true);
  });

  test('should use default values', () => {
    const limiter = rateLimit();
    const req = mockReq('10.0.0.6');
    const result = limiter(req);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59); // default 60 - 1
  });
});
