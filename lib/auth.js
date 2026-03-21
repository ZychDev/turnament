import { readDb } from './db';
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'jaskinia-cup-2026-secret-key';

// Create a signed token from password (HMAC-SHA256)
export function createToken(password) {
  return createHmac('sha256', SECRET).update(password).digest('hex');
}

// Verify token against stored password
export async function checkAuth(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;

  const db = await readDb();
  const expected = createToken(db.config.adminPassword);

  // Use timing-safe comparison to prevent timing attacks
  try {
    const a = Buffer.from(token, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    // Fallback for non-hex tokens (backwards compat during transition)
    return token === db.config.adminPassword;
  }
}
