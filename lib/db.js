import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');
const HISTORY_PATH = path.join(process.cwd(), 'db_history.json');
const MAX_HISTORY = 20;

export function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

export function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function writeDbWithHistory(data) {
  const current = readDb();
  const history = readHistory();
  history.unshift({ timestamp: Date.now(), state: current });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history));
  writeDb(data);
}

export function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

export function undoLast() {
  const history = readHistory();
  if (history.length === 0) return null;
  const last = history.shift();
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history));
  writeDb(last.state);
  return last.state;
}

// SSE version tracking
let _version = Date.now();
export function getVersion() { return _version; }
export function bumpVersion() { _version = Date.now(); }
