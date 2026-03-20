import { createClient } from '@libsql/client';

let _client = null;
let _initialized = false;

function getClient() {
  if (!_client) {
    _client = createClient({
      url: (process.env.TURSO_URL || 'file:local.db').trim(),
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
  }
  return _client;
}

async function ensureInit() {
  if (_initialized) return;
  await getClient().batch([
    `CREATE TABLE IF NOT EXISTS tournament (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, state TEXT)`,
    `CREATE TABLE IF NOT EXISTS predictions (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL DEFAULT '{}')`,
    `CREATE TABLE IF NOT EXISTS archives (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, name TEXT, data TEXT)`,
    `CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, matchId TEXT NOT NULL, nickname TEXT NOT NULL, message TEXT NOT NULL, timestamp INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS mvp_votes (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL DEFAULT '{}')`,
    `CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT, mediaUrl TEXT, mediaType TEXT, reactions TEXT DEFAULT '{}', createdAt INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS post_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, postId INTEGER NOT NULL, nickname TEXT NOT NULL, message TEXT NOT NULL, timestamp INTEGER NOT NULL)`,
  ]);

  // Seed with default data if empty
  const row = await getClient().execute('SELECT data FROM tournament WHERE id = 1');
  if (row.rows.length === 0) {
    const defaultDb = getDefaultDb();
    await getClient().execute({
      sql: 'INSERT INTO tournament (id, data) VALUES (1, ?)',
      args: [JSON.stringify(defaultDb)],
    });
  }

  // Ensure predictions row exists
  const predRow = await getClient().execute('SELECT data FROM predictions WHERE id = 1');
  if (predRow.rows.length === 0) {
    await getClient().execute("INSERT INTO predictions (id, data) VALUES (1, '{}')");
  }

  _initialized = true;
}

function getDefaultDb() {
  const makeMatch = (id) => ({
    id, t1: null, t2: null, wins: [0, 0], winner: null,
    scheduledTime: '', games: [], status: '', liveStartTime: null, comment: '', mvp: '',
  });

  return {
    config: { tournamentName: 'Jaskina Cup', adminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin' },
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
  const result = await getClient().execute('SELECT data FROM tournament WHERE id = 1');
  return JSON.parse(result.rows[0].data);
}

export async function writeDb(data) {
  await ensureInit();
  await getClient().execute({
    sql: 'UPDATE tournament SET data = ? WHERE id = 1',
    args: [JSON.stringify(data)],
  });
}

export async function writeDbWithHistory(data) {
  await ensureInit();
  const current = await readDb();
  await getClient().execute({
    sql: 'INSERT INTO history (timestamp, state) VALUES (?, ?)',
    args: [Date.now(), JSON.stringify(current)],
  });
  // Keep max 20 history entries
  await getClient().execute('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 20)');
  await writeDb(data);
}

export async function readHistory() {
  await ensureInit();
  const result = await getClient().execute('SELECT timestamp, state FROM history ORDER BY id DESC');
  return result.rows.map(r => ({ timestamp: r.timestamp, state: JSON.parse(r.state) }));
}

export async function undoLast() {
  await ensureInit();
  const result = await getClient().execute('SELECT id, state FROM history ORDER BY id DESC LIMIT 1');
  if (result.rows.length === 0) return null;
  const last = result.rows[0];
  const state = JSON.parse(last.state);
  await getClient().execute({ sql: 'DELETE FROM history WHERE id = ?', args: [last.id] });
  await writeDb(state);
  return state;
}

// Predictions
export async function readPredictions() {
  await ensureInit();
  const result = await getClient().execute('SELECT data FROM predictions WHERE id = 1');
  return JSON.parse(result.rows[0].data);
}

export async function writePredictions(data) {
  await ensureInit();
  await getClient().execute({
    sql: 'UPDATE predictions SET data = ? WHERE id = 1',
    args: [JSON.stringify(data)],
  });
}

// Archives
export async function readArchives() {
  await ensureInit();
  const result = await getClient().execute('SELECT timestamp, name, data FROM archives ORDER BY id DESC');
  return result.rows.map(r => ({ timestamp: r.timestamp, name: r.name, data: JSON.parse(r.data) }));
}

export async function writeArchive(name, data) {
  await ensureInit();
  await getClient().execute({
    sql: 'INSERT INTO archives (timestamp, name, data) VALUES (?, ?, ?)',
    args: [Date.now(), name, JSON.stringify(data)],
  });
}

// Chat
export async function readChat(matchId) {
  await ensureInit();
  const result = await getClient().execute({
    sql: 'SELECT id, matchId, nickname, message, timestamp FROM chat WHERE matchId = ? ORDER BY id ASC LIMIT 100',
    args: [matchId],
  });
  return result.rows;
}

export async function addChatMessage(matchId, nickname, message) {
  await ensureInit();
  const ts = Date.now();
  const result = await getClient().execute({
    sql: 'INSERT INTO chat (matchId, nickname, message, timestamp) VALUES (?, ?, ?, ?)',
    args: [matchId, nickname, message, ts],
  });
  const inserted = await getClient().execute({
    sql: 'SELECT id, matchId, nickname, message, timestamp FROM chat WHERE id = ?',
    args: [result.lastInsertRowid],
  });
  return inserted.rows[0];
}

// MVP Votes
export async function readMvpVotes() {
  await ensureInit();
  try {
    const result = await getClient().execute('SELECT data FROM mvp_votes WHERE id = 1');
    return result.rows.length > 0 ? JSON.parse(result.rows[0].data) : {};
  } catch { return {}; }
}

export async function writeMvpVotes(data) {
  await ensureInit();
  const json = JSON.stringify(data);
  await getClient().execute({ sql: 'INSERT OR REPLACE INTO mvp_votes (id, data) VALUES (1, ?)', args: [json] });
}

// Posts
export async function readPosts() {
  await ensureInit();
  const result = await getClient().execute('SELECT id, title, content, mediaUrl, mediaType, reactions, createdAt FROM posts ORDER BY id DESC');
  return result.rows.map(r => ({ ...r, reactions: JSON.parse(r.reactions || '{}') }));
}

export async function createPost(title, content, mediaUrl, mediaType) {
  await ensureInit();
  await getClient().execute({
    sql: 'INSERT INTO posts (title, content, mediaUrl, mediaType, createdAt) VALUES (?, ?, ?, ?, ?)',
    args: [title, content || '', mediaUrl || '', mediaType || '', Date.now()],
  });
}

export async function deletePost(id) {
  await ensureInit();
  await getClient().execute({ sql: 'DELETE FROM posts WHERE id = ?', args: [id] });
  await getClient().execute({ sql: 'DELETE FROM post_comments WHERE postId = ?', args: [id] });
}

export async function reactToPost(postId, emoji) {
  await ensureInit();
  const result = await getClient().execute({ sql: 'SELECT reactions FROM posts WHERE id = ?', args: [postId] });
  if (result.rows.length === 0) return null;
  const reactions = JSON.parse(result.rows[0].reactions || '{}');
  reactions[emoji] = (reactions[emoji] || 0) + 1;
  await getClient().execute({ sql: 'UPDATE posts SET reactions = ? WHERE id = ?', args: [JSON.stringify(reactions), postId] });
  return reactions;
}

export async function readPostComments(postId) {
  await ensureInit();
  const result = await getClient().execute({
    sql: 'SELECT id, postId, nickname, message, timestamp FROM post_comments WHERE postId = ? ORDER BY id ASC LIMIT 50',
    args: [postId],
  });
  return result.rows;
}

export async function addPostComment(postId, nickname, message) {
  await ensureInit();
  await getClient().execute({
    sql: 'INSERT INTO post_comments (postId, nickname, message, timestamp) VALUES (?, ?, ?, ?)',
    args: [postId, nickname, message, Date.now()],
  });
}

// SSE version tracking (in-memory, resets on restart — that's fine)
let _version = Date.now();
export function getVersion() { return _version; }
export function bumpVersion() { _version = Date.now(); }
