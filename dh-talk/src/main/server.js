import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { insertMessage, acknowledgeMessage } from './db.js';
import { mirror } from './hermes-mirror.js';

// 메시지 허브 — 데스크1 PC 에서만 기동된다 (CLAUDE.md §4).
// v1.1: LAN 공유키 인증과 서버 권위 sender 보정.

const MAX_PAYLOAD = 16 * 1024 * 1024; // 5MB 파일의 base64(+여유)
const HELLO_TIMEOUT_MS = 5000;
const SYSTEM_USER = 'server';

let wss = null;
let attachmentsDir = null;
let authToken = '';
let allowedUsers = new Set();
let hermesConfig = { enabled: false, url: null };

export function isUsableSharedKey(value) {
  const key = String(value || '').trim();
  return key.length >= 20 && key !== 'CHANGE_ME_BEFORE_USE';
}


export function updateServerAuthToken(nextToken) {
  const next = String(nextToken || process.env.DHTALK_SHARED_KEY || '').trim();
  if (!isUsableSharedKey(next)) {
    console.error('[server] shared_key_update_rejected: 새 shared_key는 20자 이상이어야 합니다.');
    return false;
  }
  authToken = next;
  return true;
}

export function startServer(port, options = {}) {
  attachmentsDir = options.attachmentsDir ?? null;
  authToken = String(options.authToken || process.env.DHTALK_SHARED_KEY || '').trim();
  allowedUsers = new Set((options.users || []).map((u) => u.id).filter(Boolean));
  hermesConfig = {
    enabled: options.hermes?.enabled === true,
    url: options.hermes?.url || null,
  };

  if (!isUsableSharedKey(authToken)) {
    throw new Error('[server] shared_key_required: server.shared_key는 20자 이상 무작위 문자열이어야 하며 CHANGE_ME_BEFORE_USE는 사용할 수 없습니다.');
  }

  wss = new WebSocketServer({ port, maxPayload: MAX_PAYLOAD });

  wss.on('listening', () => {
    console.log(`[server] 메시지 허브 시작: ws://0.0.0.0:${port}`);
  });

  wss.on('connection', (socket, req) => {
    socket.isAuthed = false;
    socket.helloTimer = setTimeout(() => reject(socket, 'hello_timeout', '5초 안에 인증 hello가 필요합니다.'), HELLO_TIMEOUT_MS);
    console.log(`[server] 클라이언트 접속: ${req.socket.remoteAddress}`);
    socket.on('message', (raw) => handleIncoming(socket, raw));
    socket.on('error', (err) => console.error('[server] socket 오류:', err.message));
    socket.on('close', () => {
      clearTimeout(socket.helloTimer);
      console.log(`[server] 클라이언트 해제: ${socket.userId ?? '미식별'}`);
    });
  });

  wss.on('error', (err) => console.error('[server] 서버 오류:', err.message));
  return wss;
}

const pad = (n) => String(n).padStart(2, '0');
const cleanText = (value, max = 4000) => String(value ?? '').slice(0, max);

function reject(socket, code, reason) {
  try {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ kind: 'error', code, reason }));
  } finally {
    socket.close(1008, reason);
  }
}

function authenticateHello(socket, msg) {
  const userId = cleanText(msg.userId, 64).trim();
  const token = String(msg.token || '').trim();
  if (!userId) return reject(socket, 'missing_user', 'userId가 필요합니다.');
  if (allowedUsers.size && !allowedUsers.has(userId)) {
    return reject(socket, 'unknown_user', '등록되지 않은 사용자입니다.');
  }
  if (authToken && token !== authToken) {
    return reject(socket, 'auth_failed', '공유키가 일치하지 않습니다.');
  }
  clearTimeout(socket.helloTimer);
  socket.userId = userId;
  socket.isAuthed = true;
  socket.send(JSON.stringify({ kind: 'hello_ack', userId }));
  console.log(`[server] 인증/식별: ${userId}`);
}

function requireAuth(socket, msg) {
  if (msg.kind === 'hello') return true;
  if (socket.isAuthed) return true;
  reject(socket, 'not_authenticated', '인증 후 메시지를 보낼 수 있습니다.');
  return false;
}

// 첨부를 data/attachments/YYYY-MM-DD/HH-mm_<sender>_<filename> 에 저장.
// 반환: 상대경로(posix) 또는 null.
function saveAttachment(msg, ts, sender) {
  if (!attachmentsDir || !msg.dataBase64) return null;
  try {
    const d = new Date(ts);
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hm = `${pad(d.getHours())}-${pad(d.getMinutes())}`;
    const dir = path.join(attachmentsDir, day);
    fs.mkdirSync(dir, { recursive: true });

    // 경로 구분자 등 위험 문자 제거 (디렉터리 탈출 방지)
    const safe = String(msg.filename || 'file').replace(/[^\w.가-힣-]/g, '_');
    const filename = `${hm}_${sender}_${safe}`;
    fs.writeFileSync(path.join(dir, filename), Buffer.from(msg.dataBase64, 'base64'));
    return path.posix.join('attachments', day, filename);
  } catch (err) {
    console.error('[server] 첨부 저장 실패:', err.message);
    return null;
  }
}

function handleIncoming(socket, raw) {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return console.error('[server] 잘못된 JSON 수신');
  }

  if (!requireAuth(socket, msg)) return;

  switch (msg.kind) {
    case 'hello':
      authenticateHello(socket, msg);
      break;

    case 'message': {
      const ts = msg.ts ?? Date.now();
      const sender = socket.userId || SYSTEM_USER;
      const normalized = {
        ...msg,
        kind: 'message',
        ts,
        sender,
        recipient: cleanText(msg.recipient || 'all', 128),
        type: cleanText(msg.type || 'text', 32),
        body: cleanText(msg.body, 4000),
      };
      const id = insertMessage(normalized);
      broadcast({ ...normalized, id });
      // mirror_to 에 telegram 이 있으면 Hermes 경유 미러링. 설정에서 명시적으로 켠 경우에만 외부 전송한다.
      if (hermesConfig.enabled) mirror({ ...normalized, id }, hermesConfig);
      break;
    }

    case 'file': {
      const ts = msg.ts ?? Date.now();
      const sender = socket.userId || SYSTEM_USER;
      const filename = cleanText(msg.filename || 'file', 180);
      const attachmentPath = saveAttachment({ ...msg, filename }, ts, sender);
      const id = insertMessage({
        ts,
        sender,
        recipient: cleanText(msg.recipient || 'all', 128),
        type: 'file',
        body: filename,
        attachment_path: attachmentPath,
      });
      // dataBase64/mime 는 DB 에 저장하지 않고 라이브 렌더용으로만 전파한다.
      broadcast({
        kind: 'message',
        id,
        ts,
        sender,
        recipient: cleanText(msg.recipient || 'all', 128),
        type: 'file',
        body: filename,
        attachment_path: attachmentPath,
        mime: cleanText(msg.mime, 128),
        dataBase64: msg.dataBase64,
      });
      break;
    }

    case 'ack':
      if (msg.id) acknowledgeMessage(msg.id);
      broadcast({ kind: 'ack', id: msg.id, by: socket.userId, ts: Date.now() });
      break;

    case 'escalate':
      broadcast({ ...msg, by: socket.userId, ts: Date.now() });
      break;

    default:
      console.error('[server] 알 수 없는 kind:', msg.kind);
  }
}

function broadcast(payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN && client.isAuthed) client.send(data);
  }
}

export function stopServer() {
  if (wss) {
    wss.close();
    wss = null;
  }
}
