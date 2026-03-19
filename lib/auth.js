import { readDb } from './db';

export async function checkAuth(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const db = await readDb();
  return token === db.config.adminPassword;
}
