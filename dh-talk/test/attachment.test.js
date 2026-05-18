import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAttachmentFilename } from '../src/main/server.js';

test('첨부 파일명은 초 단위와 uuid suffix를 포함해 충돌을 줄인다', () => {
  const ts = new Date('2026-05-18T09:08:07+09:00').getTime();
  const name = makeAttachmentFilename(
    { sender: 'doctor', filename: '위험 파일 이름?.pdf' },
    ts,
    '12345678-aaaa-bbbb-cccc-dddddddddddd',
  );
  assert.equal(name, '00-08-07_doctor_12345678_위험_파일_이름_.pdf');
});

test('같은 분에 같은 파일명이어도 uuid suffix가 다르면 경로가 달라진다', () => {
  const ts = Date.UTC(2026, 4, 18, 0, 0, 0);
  const msg = { sender: 'desk1', filename: 'scan.pdf' };
  assert.notEqual(
    makeAttachmentFilename(msg, ts, 'aaaaaaaa-0000-0000-0000-000000000000'),
    makeAttachmentFilename(msg, ts, 'bbbbbbbb-0000-0000-0000-000000000000'),
  );
});
