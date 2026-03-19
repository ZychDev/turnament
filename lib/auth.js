import { readDb } from './db';

export function checkAuth(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const db = readDb();
  return token === db.config.adminPassword;
}
