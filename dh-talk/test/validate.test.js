import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInbound } from '../src/main/validate.js';

test('정상 텍스트 메시지 통과', () => {
  assert.equal(validateInbound({ kind: 'message', type: 'text', body: '안녕하세요' }).ok, true);
});

test('잘못된 type 거부', () => {
  assert.equal(validateInbound({ kind: 'message', type: 'bad', body: 'x' }).ok, false);
});

test('빈 body 거부', () => {
  assert.equal(validateInbound({ kind: 'message', type: 'text', body: '' }).ok, false);
});

test('잘못된 alert_level 거부', () => {
  assert.equal(
    validateInbound({ kind: 'message', type: 'macro', body: 'x', alert_level: 'wrong' }).ok,
    false,
  );
});

test('mirror_to 비허용 대상 거부', () => {
  assert.equal(
    validateInbound({ kind: 'message', type: 'macro', body: 'x', mirror_to: ['slack'] }).ok,
    false,
  );
});

test('실행파일 확장자 차단', () => {
  assert.equal(validateInbound({ kind: 'file', filename: 'bad.exe', dataBase64: 'AAA' }).ok, false);
});

test('일반 문서 파일 허용', () => {
  assert.equal(
    validateInbound({ kind: 'file', filename: '보험서류.pdf', dataBase64: 'AAA' }).ok,
    true,
  );
});

test('5MB 초과 파일 거부', () => {
  const huge = 'A'.repeat(8 * 1024 * 1024);
  assert.equal(validateInbound({ kind: 'file', filename: 'big.png', dataBase64: huge }).ok, false);
});

test('ack 정상/비정상 id', () => {
  assert.equal(validateInbound({ kind: 'ack', id: 3 }).ok, true);
  assert.equal(validateInbound({ kind: 'ack', id: -1 }).ok, false);
});

test('알 수 없는 kind 거부', () => {
  assert.equal(validateInbound({ kind: 'hello' }).ok, false);
});
