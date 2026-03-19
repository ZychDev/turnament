import fs from 'fs';
import path from 'path';
import { readDb } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

const ARCHIVES_PATH = path.join(process.cwd(), 'archives.json');

function readArchives() {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVES_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeArchives(data) {
  fs.writeFileSync(ARCHIVES_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const archives = readArchives();
  return Response.json(archives);
}

export async function POST(req) {
  if (!checkAuth(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = readDb();
  const { name } = await req.json().catch(() => ({}));

  const archives = readArchives();
  archives.push({
    timestamp: Date.now(),
    name: name || db.config.tournamentName || 'Tournament',
    data: db,
  });

  writeArchives(archives);

  return Response.json({ ok: true, count: archives.length });
}
