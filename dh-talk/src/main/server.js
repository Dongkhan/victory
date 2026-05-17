import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { insertMessage, acknowledgeMessage } from './db.js';

// 메시지 허브 — 데스크1 PC 에서만 기동된다 (CLAUDE.md §4).
// 클라이언트가 보낸 메시지를 DB 에 저장하고 전 클라이언트에 브로드캐스트한다.
// v1 은 단일 공유 채널: 모든 메시지를 모두에게 전달, 구분은 sender/alert_level 로.

const MAX_PAYLOAD = 16 * 1024 * 1024; // 5MB 파일의 base64(+여유)

let wss = null;
let attachmentsDir = null;

export function startServer(port, options = {}) {
  attachmentsDir = options.attachmentsDir ?? null;
  wss = new WebSocketServer({ port, maxPayload: MAX_PAYLOAD });

  wss.on('listening', () => {
    console.log(`[server] 메시지 허브 시작: ws://0.0.0.0:${port}`);
  });

  wss.on('connection', (socket, req) => {
    console.log(`[server] 클라이언트 접속: ${req.socket.remoteAddress}`);
    socket.on('message', (raw) => handleIncoming(socket, raw));
    socket.on('error', (err) => console.error('[server] socket 오류:', err.message));
    socket.on('close', () =>
      console.log(`[server] 클라이언트 해제: ${socket.userId ?? '미식별'}`),
    );
  });

  wss.on('error', (err) => console.error('[server] 서버 오류:', err.message));
  return wss;
}

const pad = (n) => String(n).padStart(2, '0');

// 첨부를 data/attachments/YYYY-MM-DD/HH-mm_<sender>_<filename> 에 저장.
// 반환: 상대경로(posix) 또는 null.
function saveAttachment(msg, ts) {
  if (!attachmentsDir || !msg.dataBase64) return null;
  try {
    const d = new Date(ts);
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hm = `${pad(d.getHours())}-${pad(d.getMinutes())}`;
    const dir = path.join(attachmentsDir, day);
    fs.mkdirSync(dir, { recursive: true });

    // 경로 구분자 등 위험 문자 제거 (디렉터리 탈출 방지)
    const safe = String(msg.filename || 'file').replace(/[^\w.가-힣-]/g, '_');
    const filename = `${hm}_${msg.sender}_${safe}`;
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

  switch (msg.kind) {
    case 'hello':
      socket.userId = msg.userId;
      console.log(`[server] 식별: ${msg.userId}`);
      break;

    case 'message': {
      const ts = msg.ts ?? Date.now();
      const id = insertMessage({ ...msg, ts });
      broadcast({ ...msg, kind: 'message', id, ts });
      break;
    }

    case 'file': {
      const ts = msg.ts ?? Date.now();
      const attachmentPath = saveAttachment(msg, ts);
      const id = insertMessage({
        ts,
        sender: msg.sender,
        recipient: msg.recipient ?? 'all',
        type: 'file',
        body: msg.filename,
        attachment_path: attachmentPath,
      });
      // dataBase64/mime 는 DB 에 저장하지 않고 라이브 렌더용으로만 전파한다.
      broadcast({
        kind: 'message',
        id,
        ts,
        sender: msg.sender,
        recipient: msg.recipient ?? 'all',
        type: 'file',
        body: msg.filename,
        attachment_path: attachmentPath,
        mime: msg.mime,
        dataBase64: msg.dataBase64,
      });
      break;
    }

    case 'ack':
      if (msg.id) acknowledgeMessage(msg.id);
      broadcast(msg);
      break;

    case 'escalate':
      broadcast(msg);
      break;

    default:
      console.error('[server] 알 수 없는 kind:', msg.kind);
  }
}

function broadcast(payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(data);
  }
}

export function stopServer() {
  if (wss) {
    wss.close();
    wss = null;
  }
}
