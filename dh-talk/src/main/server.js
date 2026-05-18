import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { insertMessage, acknowledgeMessage } from './db.js';
import { mirror } from './hermes-mirror.js';
import { makeNonce, verifyHmac } from './auth.js';
import { validateInbound } from './validate.js';
import { MAX_WS_PAYLOAD_BYTES } from '../shared/limits.js';

// 메시지 허브 — 데스크1 PC 에서만 기동된다 (CLAUDE.md §4).
// 접속 시 shared secret HMAC 챌린지로 인증한다. 인증 전에는 어떤 메시지도 받지 않으며,
// 인증 후 sender 는 항상 인증된 userId 로 강제한다 (위장 방지, 개선분석 1·7순위).


let wss = null;
let attachmentsDir = null;
let getSecurity = () => ({ sharedKey: '', userIds: [] });

export function startServer(port, options = {}) {
  attachmentsDir = options.attachmentsDir ?? null;
  getSecurity = options.getSecurity ?? getSecurity;
  wss = new WebSocketServer({ port, maxPayload: MAX_WS_PAYLOAD_BYTES });

  wss.on('listening', () => {
    console.log(`[server] 메시지 허브 시작: ws://0.0.0.0:${port}`);
  });

  wss.on('connection', (socket, req) => {
    console.log(`[server] 클라이언트 접속: ${req.socket.remoteAddress}`);
    socket.authorized = false;
    socket.nonce = makeNonce();
    socket.send(JSON.stringify({ kind: 'challenge', nonce: socket.nonce }));

    socket.on('message', (raw) => handleIncoming(socket, raw));
    socket.on('error', (err) => console.error('[server] socket 오류:', err.message));
    socket.on('close', () =>
      console.log(`[server] 클라이언트 해제: ${socket.userId ?? '미인증'}`),
    );
  });

  wss.on('error', (err) => console.error('[server] 서버 오류:', err.message));
  return wss;
}

function handleAuth(socket, msg) {
  if (msg.kind !== 'auth') {
    return console.error('[server] 인증 전 메시지 무시:', msg.kind);
  }
  const { sharedKey, userIds } = getSecurity();
  if (!sharedKey) {
    console.error('[server] shared_key 미설정 — 연결 거부');
    return socket.close(4001, 'no shared key');
  }
  if (verifyHmac(sharedKey, socket.nonce, msg.hmac) && userIds.includes(msg.userId)) {
    socket.authorized = true;
    socket.userId = msg.userId;
    socket.send(JSON.stringify({ kind: 'authorized' }));
    console.log(`[server] 인증 성공: ${msg.userId}`);
  } else {
    console.error(`[server] 인증 실패: userId=${msg.userId}`);
    socket.close(4001, 'auth failed');
  }
}

function handleIncoming(socket, raw) {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return console.error('[server] 잘못된 JSON 수신');
  }

  if (!socket.authorized) {
    return handleAuth(socket, msg);
  }

  const check = validateInbound(msg);
  if (!check.ok) {
    return console.error(`[server] 메시지 거부 (${socket.userId}):`, check.reason);
  }

  switch (msg.kind) {
    case 'message': {
      const ts = msg.ts ?? Date.now();
      const sender = socket.userId; // 위장 방지 — 인증된 id 로 강제
      const id = insertMessage({ ...msg, sender, ts });
      broadcast({ ...msg, kind: 'message', sender, id, ts });
      mirror({ ...msg, sender, ts });
      break;
    }

    case 'file': {
      const ts = msg.ts ?? Date.now();
      const sender = socket.userId;
      const attachmentPath = saveAttachment({ ...msg, sender }, ts);
      const id = insertMessage({
        ts,
        sender,
        recipient: msg.recipient ?? 'all',
        type: 'file',
        body: msg.filename,
        attachment_path: attachmentPath,
      });
      broadcast({
        kind: 'message',
        id,
        ts,
        sender,
        recipient: msg.recipient ?? 'all',
        type: 'file',
        body: msg.filename,
        attachment_path: attachmentPath,
        mime: msg.mime,
        dataBase64: msg.dataBase64,
      });
      break;
    }

    case 'ack': {
      // 첫 ack 만 기록·전파 (중복 ack 무시). 확인자는 인증된 id 로 강제.
      const changed = acknowledgeMessage(msg.id, socket.userId);
      if (changed) broadcast({ kind: 'ack', id: msg.id, by: socket.userId });
      break;
    }

    case 'escalate':
      broadcast({ ...msg, kind: 'escalate', by: socket.userId });
      break;

    default:
      console.error('[server] 처리할 수 없는 kind:', msg.kind);
  }
}

const pad = (n) => String(n).padStart(2, '0');

// 첨부를 data/attachments/YYYY-MM-DD/HH-mm_<sender>_<filename> 에 저장.
function saveAttachment(msg, ts) {
  if (!attachmentsDir || !msg.dataBase64) return null;
  try {
    const d = new Date(ts);
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hm = `${pad(d.getHours())}-${pad(d.getMinutes())}`;
    const dir = path.join(attachmentsDir, day);
    fs.mkdirSync(dir, { recursive: true });

    const safe = String(msg.filename || 'file').replace(/[^\w.가-힣-]/g, '_');
    const filename = `${hm}_${msg.sender}_${safe}`;
    fs.writeFileSync(path.join(dir, filename), Buffer.from(msg.dataBase64, 'base64'));
    return path.posix.join('attachments', day, filename);
  } catch (err) {
    console.error('[server] 첨부 저장 실패:', err.message);
    return null;
  }
}

function broadcast(payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.authorized && client.readyState === client.OPEN) client.send(data);
  }
}

export function stopServer() {
  if (wss) {
    wss.close();
    wss = null;
  }
}
