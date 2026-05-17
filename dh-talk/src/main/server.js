import { WebSocketServer } from 'ws';
import { insertMessage, acknowledgeMessage } from './db.js';

// 메시지 허브 — 데스크1 PC 에서만 기동된다 (CLAUDE.md §4).
// 클라이언트가 보낸 메시지를 DB 에 저장하고 전 클라이언트에 브로드캐스트한다.
// v1 은 단일 공유 채널: 모든 메시지를 모두에게 전달, 구분은 sender/alert_level 로.

let wss = null;

export function startServer(port) {
  wss = new WebSocketServer({ port });

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

function handleIncoming(socket, raw) {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return console.error('[server] 잘못된 JSON 수신');
  }

  switch (msg.kind) {
    case 'hello':
      // 접속 클라이언트 식별 (desk1/desk2/desk3/doctor)
      socket.userId = msg.userId;
      console.log(`[server] 식별: ${msg.userId}`);
      break;

    case 'message': {
      const ts = msg.ts ?? Date.now();
      const id = insertMessage({ ...msg, ts });
      broadcast({ ...msg, kind: 'message', id, ts });
      break;
    }

    case 'ack':
      // 펄스 알람 확인 — 확인 시각 기록 후 전 클라이언트에 전파.
      if (msg.id) acknowledgeMessage(msg.id);
      broadcast(msg);
      break;

    case 'escalate':
      // 원장 60초 미확인 — 데스크 PC 들이 대신 알리도록 전파.
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
