import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { initDb, closeDb, insertMessage } from '../src/main/db.js';
import { createEscalationPayload } from '../src/main/server.js';

test('escalate payload is rebuilt from server DB and ignores forged original', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dhtalk-escalate-'));
  initDb(path.join(dir, 'messages.db'));
  try {
    const id = insertMessage({
      ts: 1710000000000,
      sender: 'desk1',
      recipient: 'doctor',
      type: 'macro',
      body: '김철수 님 들어오세요',
      patient_name: '김철수',
      alert_level: 'next_patient',
    });

    const payload = createEscalationPayload({
      id,
      by: 'desk2',
      original: { id, sender: 'attacker', body: '위조 긴급 호출', alert_level: 'urgent' },
    });

    assert.equal(payload.kind, 'escalate');
    assert.equal(payload.by, 'desk2');
    assert.equal(payload.original.sender, 'desk1');
    assert.equal(payload.original.body, '김철수 님 들어오세요');
    assert.equal(payload.original.alert_level, 'next_patient');
    assert.equal(payload.original.body.includes('위조'), false);
  } finally {
    closeDb();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('escalate payload is rejected when the DB message does not exist', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dhtalk-escalate-missing-'));
  initDb(path.join(dir, 'messages.db'));
  try {
    assert.equal(createEscalationPayload({ id: 9999, by: 'desk2' }), null);
  } finally {
    closeDb();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
