import test from 'node:test';
import assert from 'node:assert/strict';
import { makeNonce, signNonce, verifyHmac } from '../src/main/auth.js';

test('makeNonce 는 32 hex 문자', () => {
  assert.match(makeNonce(), /^[0-9a-f]{32}$/);
});

test('verifyHmac 정상 서명 통과', () => {
  const sig = signNonce('key1', 'nonceABC');
  assert.equal(verifyHmac('key1', 'nonceABC', sig), true);
});

test('verifyHmac 위조 서명 거부', () => {
  assert.equal(verifyHmac('key1', 'nonceABC', 'deadbeef'), false);
});

test('verifyHmac 키 불일치 거부', () => {
  const sig = signNonce('key1', 'nonceABC');
  assert.equal(verifyHmac('wrongkey', 'nonceABC', sig), false);
});

test('verifyHmac 빈 키 거부', () => {
  assert.equal(verifyHmac('', 'nonce', 'whatever'), false);
});

test('서명은 키/nonce 에 결정적', () => {
  assert.equal(signNonce('k', 'n'), signNonce('k', 'n'));
  assert.notEqual(signNonce('k', 'n1'), signNonce('k', 'n2'));
});
