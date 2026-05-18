import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import WebSocket from 'ws';
import { initDb, closeDb } from '../src/main/db.js';
import { signNonce } from '../src/main/auth.js';
import { startServer, stopServer } from '../src/main/server.js';

const SHARED_KEY = 'test-shared-key-32-bytes-minimum';
const USERS = ['desk1', 'doctor'];

function onceMessage(ws, predicate = () => true, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timed out waiting for matching WebSocket message'));
    }, timeoutMs);
    const onMessage = (raw) => {
      const msg = JSON.parse(raw.toString());
      if (!predicate(msg)) return;
      cleanup();
      resolve(msg);
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    function cleanup() {
      clearTimeout(timer);
      ws.off('message', onMessage);
      ws.off('error', onError);
    }
    ws.on('message', onMessage);
    ws.on('error', onError);
  });
}

function onceClose(ws, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.CLOSED) return resolve();
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timed out waiting for WebSocket close'));
    }, timeoutMs);
    const onClose = () => {
      cleanup();
      resolve();
    };
    function cleanup() {
      clearTimeout(timer);
      ws.off('close', onClose);
    }
    ws.on('close', onClose);
  });
}

async function connectAuthed(port, userId) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const challenge = await onceMessage(ws, (m) => m.kind === 'challenge');
  ws.send(JSON.stringify({ kind: 'auth', userId, hmac: signNonce(SHARED_KEY, challenge.nonce) }));
  await onceMessage(ws, (m) => m.kind === 'authorized');
  return ws;
}

async function withServer(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dhtalk-e2e-'));
  initDb(path.join(dir, 'messages.db'));
  const server = startServer(0, {
    getSecurity: () => ({ sharedKey: SHARED_KEY, userIds: USERS }),
    attachmentsDir: path.join(dir, 'attachments'),
  });
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  try {
    await fn({ port });
  } finally {
    await stopServer();
    closeDb();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('multi-client server forces authenticated sender and broadcasts exactly one ack', async () => {
  await withServer(async ({ port }) => {
    const desk = await connectAuthed(port, 'desk1');
    const doctor = await connectAuthed(port, 'doctor');
    try {
      desk.send(JSON.stringify({
        kind: 'message',
        sender: 'attacker',
        recipient: 'all',
        type: 'macro',
        body: '김철수 님 들어오세요',
        patient_name: '김철수',
        alert_level: 'next_patient',
        ts: 1710000000000,
      }));

      const [deskMessage, doctorMessage] = await Promise.all([
        onceMessage(desk, (m) => m.kind === 'message'),
        onceMessage(doctor, (m) => m.kind === 'message'),
      ]);
      assert.equal(deskMessage.sender, 'desk1');
      assert.equal(doctorMessage.sender, 'desk1');
      assert.equal(doctorMessage.body, '김철수 님 들어오세요');
      assert.ok(doctorMessage.id > 0);

      doctor.send(JSON.stringify({ kind: 'ack', id: doctorMessage.id }));
      doctor.send(JSON.stringify({ kind: 'ack', id: doctorMessage.id }));

      const [deskAck, doctorAck] = await Promise.all([
        onceMessage(desk, (m) => m.kind === 'ack'),
        onceMessage(doctor, (m) => m.kind === 'ack'),
      ]);
      assert.deepEqual({ id: deskAck.id, by: deskAck.by }, { id: doctorMessage.id, by: 'doctor' });
      assert.deepEqual({ id: doctorAck.id, by: doctorAck.by }, { id: doctorMessage.id, by: 'doctor' });

      await assert.rejects(
        onceMessage(doctor, (m) => m.kind === 'ack', 250),
        /timed out/,
      );
    } finally {
      desk.close();
      doctor.close();
    }
  });
});

test('stopServer closes active clients so packaged app shutdown is clean', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dhtalk-stop-'));
  initDb(path.join(dir, 'messages.db'));
  const server = startServer(0, {
    getSecurity: () => ({ sharedKey: SHARED_KEY, userIds: USERS }),
  });
  await new Promise((resolve) => server.once('listening', resolve));
  const ws = await connectAuthed(server.address().port, 'desk1');
  try {
    const closing = onceClose(ws);
    await stopServer();
    await closing;
    assert.equal(ws.readyState, WebSocket.CLOSED);
  } finally {
    if (ws.readyState !== WebSocket.CLOSED) ws.terminate();
    await stopServer();
    closeDb();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
