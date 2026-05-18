import test from 'node:test';
import assert from 'node:assert/strict';
import { signNonce, verifyHmac } from '../src/main/auth.js';
import { validateInbound } from '../src/main/validate.js';
import { MAX_FILE_BASE64_CHARS } from '../src/shared/limits.js';

test('HMAC 인증은 올바른 키/nonce만 통과한다', () => {
  const key = 'clinic-secret';
  const nonce = 'nonce-1';
  const sig = signNonce(key, nonce);
  assert.equal(verifyHmac(key, nonce, sig), true);
  assert.equal(verifyHmac(key, nonce, signNonce('other', nonce)), false);
  assert.equal(verifyHmac(key, nonce, sig.slice(2)), false);
});

test('메시지 스키마 정상/비정상 검증', () => {
  assert.deepEqual(
    validateInbound({ kind: 'message', type: 'macro', body: '김철수 님 들어오세요', alert_level: 'next_patient', mirror_to: ['telegram'] }),
    { ok: true },
  );
  assert.equal(validateInbound({ kind: 'message', type: 'macro', body: '' }).ok, false);
  assert.equal(validateInbound({ kind: 'message', type: 'macro', body: 'x', mirror_to: ['slack'] }).ok, false);
  assert.equal(validateInbound({ kind: 'message', type: 'bad', body: 'x' }).ok, false);
});

test('파일 검증은 위험 확장자와 5MB 초과를 차단한다', () => {
  assert.deepEqual(validateInbound({ kind: 'file', filename: 'scan.pdf', dataBase64: 'a'.repeat(64) }), { ok: true });
  assert.equal(validateInbound({ kind: 'file', filename: 'run.exe', dataBase64: 'a'.repeat(64) }).ok, false);
  assert.equal(validateInbound({ kind: 'file', filename: 'too-big.pdf', dataBase64: 'a'.repeat(MAX_FILE_BASE64_CHARS + 1) }).ok, false);
});

test('ack/escalate는 양의 정수 id만 허용한다', () => {
  assert.deepEqual(validateInbound({ kind: 'ack', id: 1 }), { ok: true });
  assert.deepEqual(validateInbound({ kind: 'escalate', id: 2 }), { ok: true });
  assert.equal(validateInbound({ kind: 'ack', id: 0 }).ok, false);
  assert.equal(validateInbound({ kind: 'escalate', id: '2' }).ok, false);
});
