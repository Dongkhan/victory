import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// SQLite + FTS5. 스키마는 CLAUDE.md §6 기준.
// v1 은 단일 스키마라 IF NOT EXISTS 로 멱등 생성한다 (별도 마이그레이션 러너 없음).

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT,
  patient_name TEXT,
  attachment_path TEXT,
  alert_level TEXT,
  acknowledged_at INTEGER,
  mirrored_to TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(ts);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages(patient_name);

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  body, patient_name, sender,
  content='messages', content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, body, patient_name, sender)
  VALUES (new.id, new.body, new.patient_name, new.sender);
END;

CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts, rowid, body, patient_name, sender)
  VALUES ('delete', old.id, old.body, old.patient_name, old.sender);
END;

CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts, rowid, body, patient_name, sender)
  VALUES ('delete', old.id, old.body, old.patient_name, old.sender);
  INSERT INTO messages_fts(rowid, body, patient_name, sender)
  VALUES (new.id, new.body, new.patient_name, new.sender);
END;

CREATE TABLE IF NOT EXISTS patients_today (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL,
  is_walkin INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

export function initDb(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  console.log(`[db] 초기화 완료: ${dbPath}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB 가 초기화되지 않았습니다 — initDb() 를 먼저 호출하세요.');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// --- messages ---

export function insertMessage(msg) {
  const info = getDb()
    .prepare(
      `INSERT INTO messages
         (ts, sender, recipient, type, body, patient_name, attachment_path, alert_level, mirrored_to)
       VALUES
         (@ts, @sender, @recipient, @type, @body, @patient_name, @attachment_path, @alert_level, @mirrored_to)`,
    )
    .run({
      ts: msg.ts ?? Date.now(),
      sender: msg.sender,
      recipient: msg.recipient ?? 'all',
      type: msg.type ?? 'text',
      body: msg.body ?? null,
      patient_name: msg.patient_name ?? null,
      attachment_path: msg.attachment_path ?? null,
      alert_level: msg.alert_level ?? null,
      mirrored_to: msg.mirrored_to ? JSON.stringify(msg.mirrored_to) : null,
    });
  return info.lastInsertRowid;
}

export function listRecentMessages(limit = 200) {
  return getDb()
    .prepare('SELECT * FROM messages ORDER BY ts DESC LIMIT ?')
    .all(limit)
    .reverse();
}

export function acknowledgeMessage(id, at = Date.now()) {
  getDb().prepare('UPDATE messages SET acknowledged_at = ? WHERE id = ?').run(at, id);
}
