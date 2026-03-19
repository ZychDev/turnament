import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

let _initialized = false;

async function ensureInit() {
  if (_initialized) return;
  await client.batch([
    `CREATE TABLE IF NOT EXISTS tournament (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, state TEXT)`,
    `CREATE TABLE IF NOT EXISTS predictions (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL DEFAULT '{}')`,
    `CREATE TABLE IF NOT EXISTS archives (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, name TEXT, data TEXT)`,
  ]);

  // Seed with default data if empty
  const row = await client.execute('SELECT data FROM tournament WHERE id = 1');
  if (row.rows.length === 0) {
    const defaultDb = getDefaultDb();
    await client.execute({
      sql: 'INSERT INTO tournament (id, data) VALUES (1, ?)',
      args: [JSON.stringify(defaultDb)],
    });
  }

  // Ensure predictions row exists
  const predRow = await client.execute('SELECT data FROM predictions WHERE id = 1');
  if (predRow.rows.length === 0) {
    await client.execute("INSERT INTO predictions (id, data) VALUES (1, '{}')");
  }

  _initialized = true;
}

function getDefaultDb() {
  const makeMatch = (id) => ({
    id, t1: null, t2: null, wins: [0, 0], winner: null,
    scheduledTime: '', games: [], status: '', liveStartTime: null, comment: '', mvp: '',
  });

  return {
    config: { tournamentName: 'Jaskina Cup', adminPassword: 'JaskinaCup2026!' },
    teams: [],
    bracket: {
      winners: [
        { id: 'wb-r1', name: 'WB Runda 1', bestOf: 1, matches: [makeMatch('wb-r1-m1'), makeMatch('wb-r1-m2'), makeMatch('wb-r1-m3'), makeMatch('wb-r1-m4')] },
        { id: 'wb-r2', name: 'WB Runda 2', bestOf: 1, matches: [makeMatch('wb-r2-m1'), makeMatch('wb-r2-m2')] },
        { id: 'wb-r3', name: 'WB Runda 3', bestOf: 1, matches: [makeMatch('wb-r3-m1')] },
      ],
      losers: [
        { id: 'lb-r1', name: 'LB Runda 1', bestOf: 1, matches: [makeMatch('lb-r1-m1'), makeMatch('lb-r1-m2')] },
        { id: 'lb-r2', name: 'LB Runda 2', bestOf: 1, matches: [makeMatch('lb-r2-m1'), makeMatch('lb-r2-m2')] },
        { id: 'lb-r3', name: 'LB Runda 3', bestOf: 1, matches: [makeMatch('lb-r3-m1')] },
        { id: 'lb-final', name: 'LB Final', bestOf: 3, matches: [makeMatch('lb-final-m1')] },
      ],
      grandFinal: { id: 'gf', name: 'Grand Final', bestOf: 5, matches: [makeMatch('gf-m1')] },
    },
  };
}

export async function readDb() {
  await ensureInit();
  const result = await client.execute('SELECT data FROM tournament WHERE id = 1');
  return JSON.parse(result.rows[0].data);
}

export async function writeDb(data) {
  await ensureInit();
  await client.execute({
    sql: 'UPDATE tournament SET data = ? WHERE id = 1',
    args: [JSON.stringify(data)],
  });
}

export async function writeDbWithHistory(data) {
  await ensureInit();
  const current = await readDb();
  await client.execute({
    sql: 'INSERT INTO history (timestamp, state) VALUES (?, ?)',
    args: [Date.now(), JSON.stringify(current)],
  });
  // Keep max 20 history entries
  await client.execute('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 20)');
  await writeDb(data);
}

export async function readHistory() {
  await ensureInit();
  const result = await client.execute('SELECT timestamp, state FROM history ORDER BY id DESC');
  return result.rows.map(r => ({ timestamp: r.timestamp, state: JSON.parse(r.state) }));
}

export async function undoLast() {
  await ensureInit();
  const result = await client.execute('SELECT id, state FROM history ORDER BY id DESC LIMIT 1');
  if (result.rows.length === 0) return null;
  const last = result.rows[0];
  const state = JSON.parse(last.state);
  await client.execute({ sql: 'DELETE FROM history WHERE id = ?', args: [last.id] });
  await writeDb(state);
  return state;
}

// Predictions
export async function readPredictions() {
  await ensureInit();
  const result = await client.execute('SELECT data FROM predictions WHERE id = 1');
  return JSON.parse(result.rows[0].data);
}

export async function writePredictions(data) {
  await ensureInit();
  await client.execute({
    sql: 'UPDATE predictions SET data = ? WHERE id = 1',
    args: [JSON.stringify(data)],
  });
}

// Archives
export async function readArchives() {
  await ensureInit();
  const result = await client.execute('SELECT timestamp, name, data FROM archives ORDER BY id DESC');
  return result.rows.map(r => ({ timestamp: r.timestamp, name: r.name, data: JSON.parse(r.data) }));
}

export async function writeArchive(name, data) {
  await ensureInit();
  await client.execute({
    sql: 'INSERT INTO archives (timestamp, name, data) VALUES (?, ?, ?)',
    args: [Date.now(), name, JSON.stringify(data)],
  });
}

// SSE version tracking (in-memory, resets on restart — that's fine)
let _version = Date.now();
export function getVersion() { return _version; }
export function bumpVersion() { _version = Date.now(); }
