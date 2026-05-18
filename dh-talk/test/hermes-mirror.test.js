import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveHermesRelayUrl } from '../src/main/hermes-mirror.js';

test('Hermes 미러링은 HERMES_URL 명시 설정 없이는 비활성화된다', () => {
  assert.deepEqual(resolveHermesRelayUrl({}), { ok: false, reason: 'HERMES_URL 미설정' });
});

test('Hermes 미러링은 HTTPS URL만 허용한다', () => {
  assert.deepEqual(resolveHermesRelayUrl({ HERMES_URL: 'http://76.13.179.163:8090' }), {
    ok: false,
    reason: 'HERMES_URL은 https:// 주소만 허용',
  });
  assert.deepEqual(resolveHermesRelayUrl({ HERMES_URL: 'https://hermes.example.com/' }), {
    ok: true,
    url: 'https://hermes.example.com/dhtalk/relay',
  });
});
