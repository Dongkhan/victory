import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './db.js';

// 30일 보관 정책 + 일일 정기 작업 (CLAUDE.md §11, §9 자정 리셋).

const DAY_MS = 86_400_000;
const RETENTION_DAYS = 30;

let lastRun = null;

// 진단 패널용 — 마지막 cleanup 실행 정보.
export function getLastCleanup() {
  return lastRun;
}

// 30일 지난 메시지 행 + 첨부 폴더(YYYY-MM-DD)를 삭제한다.
// FTS5 인덱스는 트리거로 자동 동기화된다.
export function runCleanup(attachmentsDir, retentionDays = RETENTION_DAYS) {
  const cutoff = Date.now() - retentionDays * DAY_MS;

  const result = getDb().prepare('DELETE FROM messages WHERE ts < ?').run(cutoff);

  let folders = 0;
  if (attachmentsDir && fs.existsSync(attachmentsDir)) {
    for (const name of fs.readdirSync(attachmentsDir)) {
      const day = Date.parse(name); // 'YYYY-MM-DD'
      if (!Number.isNaN(day) && day < cutoff) {
        fs.rmSync(path.join(attachmentsDir, name), { recursive: true, force: true });
        folders += 1;
      }
    }
  }

  console.log(
    `[cleanup] 메시지 ${result.changes}행 · 첨부 폴더 ${folders}개 삭제 (보관 ${retentionDays}일)`,
  );
  lastRun = { at: Date.now(), messages: result.changes, folders, retentionDays };
  return lastRun;
}

// 매일 지정 시각(hour)에 task 를 실행한다. setTimeout 자체 구현 (node-cron 미사용).
// 해제 함수를 반환한다.
export function scheduleDailyAt(hour, task) {
  let timer = null;

  const arm = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    timer = setTimeout(() => {
      try {
        task();
      } catch (err) {
        console.error('[cleanup] 정기 작업 실패:', err.message);
      }
      arm();
    }, next - now);
  };

  arm();
  return () => clearTimeout(timer);
}
