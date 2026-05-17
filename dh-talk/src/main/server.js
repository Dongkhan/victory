import { WebSocketServer } from 'ws';

// Day 1: 단순 echo 서버. 받은 메시지를 그대로 되돌려준다.
// Day 4 에서 메시지 허브(브로드캐스트/라우팅) 로직으로 확장한다.

let wss = null;

export function startServer(port) {
  wss = new WebSocketServer({ port });

  wss.on('listening', () => {
    console.log(`[server] WebSocket echo 서버 시작: ws://127.0.0.1:${port}`);
  });

  wss.on('connection', (socket, req) => {
    const peer = req.socket.remoteAddress;
    console.log(`[server] 클라이언트 접속: ${peer}`);

    socket.on('message', (data, isBinary) => {
      const text = isBinary ? '<binary>' : data.toString();
      console.log(`[server] 수신: ${text}`);
      socket.send(JSON.stringify({ type: 'echo', body: text, ts: Date.now() }));
    });

    socket.on('close', () => console.log(`[server] 클라이언트 해제: ${peer}`));
    socket.on('error', (err) => console.error('[server] socket 오류:', err.message));
  });

  wss.on('error', (err) => console.error('[server] 서버 오류:', err.message));

  return wss;
}

export function stopServer() {
  if (wss) {
    wss.close();
    wss = null;
  }
}
