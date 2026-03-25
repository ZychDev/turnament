const { createToken } = require('../lib/auth');

describe('Auth - createToken', () => {
  test('should create a hex token from password', () => {
    const token = createToken('testpassword');
    expect(typeof token).toBe('string');
    expect(token).toMatch(/^[0-9a-f]{64}$/); // SHA-256 = 64 hex chars
  });

  test('should create same token for same password', () => {
    const t1 = createToken('password123');
    const t2 = createToken('password123');
    expect(t1).toBe(t2);
  });

  test('should create different tokens for different passwords', () => {
    const t1 = createToken('password1');
    const t2 = createToken('password2');
    expect(t1).not.toBe(t2);
  });

  test('should handle empty password', () => {
    const token = createToken('');
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64);
  });

  test('should handle unicode passwords', () => {
    const token = createToken('hasło🔐');
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64);
  });

  test('should handle very long passwords', () => {
    const longPwd = 'a'.repeat(10000);
    const token = createToken(longPwd);
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64);
  });
});
