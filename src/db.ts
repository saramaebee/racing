// SQLite persistence via Bun's built-in driver. Schema is created on startup
// (CREATE TABLE IF NOT EXISTS) — no migration tooling for v1, deliberately lean.
import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DATABASE_PATH ?? './data/racing.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH, { create: true });
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS championships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    num_runs INTEGER NOT NULL,
    points_table TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    championship_id INTEGER NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    championship_id INTEGER NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    run_no INTEGER NOT NULL,
    time_ms INTEGER,
    position INTEGER,
    UNIQUE(participant_id, run_no)
  );

  CREATE INDEX IF NOT EXISTS idx_participants_champ ON participants(championship_id);
  CREATE INDEX IF NOT EXISTS idx_results_champ ON results(championship_id);
`);

export interface Championship {
  id: number;
  name: string;
  num_runs: number;
  points_table: string;
  created_at: string;
}

export interface Participant {
  id: number;
  championship_id: number;
  name: string;
  display_order: number;
}

export interface Result {
  id: number;
  championship_id: number;
  participant_id: number;
  run_no: number;
  time_ms: number | null;
  position: number | null;
}

export const DEFAULT_POINTS = [6, 5, 4, 3, 2, 1];

export function parsePointsTable(raw: string): number[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.every((n) => typeof n === 'number')) return arr;
  } catch {
    // fall through
  }
  return DEFAULT_POINTS;
}

export function listChampionships(): Championship[] {
  return db
    .query('SELECT * FROM championships ORDER BY created_at DESC, id DESC')
    .all() as Championship[];
}

export function getChampionship(id: number): Championship | null {
  return (db.query('SELECT * FROM championships WHERE id = ?').get(id) as Championship) ?? null;
}

export function createChampionship(
  name: string,
  numRuns: number,
  pointsTable: number[],
  participantNames: string[],
): number {
  const now = new Date().toISOString();
  const insertChamp = db.query(
    'INSERT INTO championships (name, num_runs, points_table, created_at) VALUES (?, ?, ?, ?) RETURNING id',
  );
  const insertPart = db.query(
    'INSERT INTO participants (championship_id, name, display_order) VALUES (?, ?, ?)',
  );

  const tx = db.transaction(() => {
    const row = insertChamp.get(name, numRuns, JSON.stringify(pointsTable), now) as { id: number };
    participantNames.forEach((pn, i) => insertPart.run(row.id, pn, i));
    return row.id;
  });
  return tx() as number;
}

export function getParticipants(championshipId: number): Participant[] {
  return db
    .query('SELECT * FROM participants WHERE championship_id = ? ORDER BY display_order, id')
    .all(championshipId) as Participant[];
}

export function getResults(championshipId: number): Result[] {
  return db
    .query('SELECT * FROM results WHERE championship_id = ?')
    .all(championshipId) as Result[];
}

export function addParticipant(championshipId: number, name: string): void {
  const max = db
    .query(
      'SELECT COALESCE(MAX(display_order), -1) AS m FROM participants WHERE championship_id = ?',
    )
    .get(championshipId) as { m: number };
  db.query('INSERT INTO participants (championship_id, name, display_order) VALUES (?, ?, ?)').run(
    championshipId,
    name,
    max.m + 1,
  );
}

export function addRun(championshipId: number): void {
  db.query('UPDATE championships SET num_runs = num_runs + 1 WHERE id = ?').run(championshipId);
}

// Upsert a single cell. When both time and position are null the row is removed
// so the cell reads as "not yet entered" rather than a stored blank.
export function upsertResult(
  championshipId: number,
  participantId: number,
  runNo: number,
  timeMs: number | null,
  position: number | null,
): void {
  if (timeMs === null && position === null) {
    db.query('DELETE FROM results WHERE participant_id = ? AND run_no = ?').run(
      participantId,
      runNo,
    );
    return;
  }
  db.query(
    `INSERT INTO results (championship_id, participant_id, run_no, time_ms, position)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(participant_id, run_no)
     DO UPDATE SET time_ms = excluded.time_ms, position = excluded.position`,
  ).run(championshipId, participantId, runNo, timeMs, position);
}
