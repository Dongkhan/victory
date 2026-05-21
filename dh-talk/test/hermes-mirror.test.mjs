import test from 'node:test';
import assert from 'node:assert/strict';
import { mirror } from '../src/main/hermes-mirror.js';

function withEnv(key, value, fn) {
  const before = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (before === undefined) delete process.env[key];
      else process.env[key] = before;
    });
}

function message() {
  return {
    sender: 'desk1',
    body: '민감 본문',
    patient_name: '홍길동',
    alert_level: 'next_patient',
    ts: 1716000000000,
    mirror_to: ['telegram'],
  };
}

test('disabled mirroring never calls fetch', async () => {
  const beforeFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('unexpected'); };
  await withEnv('DHTALK_API_KEY', 'secret', async () => {
    await mirror(message(), { enabled: false, url: 'https://relay.example' });
  });
  globalThis.fetch = beforeFetch;
  assert.equal(calls, 0);
});

test('enabled mirroring requires API key and explicit URL', async () => {
  const beforeFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('unexpected'); };
  await withEnv('DHTALK_API_KEY', undefined, async () => {
    await mirror(message(), { enabled: true, url: 'https://relay.example' });
  });
  await withEnv('DHTALK_API_KEY', 'secret', async () => {
    await mirror(message(), { enabled: true });
  });
  globalThis.fetch = beforeFetch;
  assert.equal(calls, 0);
});

test('http relay is rejected unless explicitly allowed', async () => {
  const beforeFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return { ok: true }; };
  await withEnv('DHTALK_API_KEY', 'secret', async () => {
    await mirror(message(), { enabled: true, url: 'http://relay.example' });
    await mirror(message(), { enabled: true, url: 'http://relay.example', allow_insecure_http: true });
  });
  globalThis.fetch = beforeFetch;
  assert.equal(calls, 1);
});

test('https relay posts only when explicitly enabled', async () => {
  const beforeFetch = globalThis.fetch;
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url: String(url), init };
    return { ok: true };
  };
  await withEnv('DHTALK_API_KEY', 'secret', async () => {
    await mirror(message(), { enabled: true, url: 'https://relay.example/base' });
  });
  globalThis.fetch = beforeFetch;
  assert.equal(seen.url, 'https://relay.example/dhtalk/relay');
  assert.equal(seen.init.headers['X-API-Key'], 'secret');
  const body = JSON.parse(seen.init.body);
  assert.equal(body.patient_name, '홍길동');
  assert.equal(body.body, '민감 본문');
});
