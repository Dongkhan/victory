import { useEffect, useRef, useState } from 'react';

const STATUS_LABEL = {
  connecting: '연결 중…',
  open: '연결됨',
  closed: '연결 끊김',
  error: '오류',
};

export default function App() {
  const [appInfo, setAppInfo] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [log, setLog] = useState([]);
  const [draft, setDraft] = useState('');

  const wsRef = useRef(null);
  const idRef = useRef(0);

  const append = (kind, text) =>
    setLog((prev) => [...prev, { id: ++idRef.current, kind, text }]);

  useEffect(() => {
    let cancelled = false;
    let ws = null;

    async function connect() {
      const info = await window.dhtalk.getAppInfo();
      if (cancelled) return;
      setAppInfo(info);

      ws = new WebSocket(`ws://127.0.0.1:${info.wsPort}`);
      wsRef.current = ws;
      setStatus('connecting');

      ws.onopen = () => !cancelled && setStatus('open');
      ws.onclose = () => !cancelled && setStatus('closed');
      ws.onerror = () => !cancelled && setStatus('error');
      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          append('recv', JSON.parse(ev.data).body);
        } catch {
          append('recv', String(ev.data));
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, []);

  const send = () => {
    const text = draft.trim();
    const ws = wsRef.current;
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(text);
    append('sent', text);
    setDraft('');
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>DH Talk</h1>
        <span className={`status status--${status}`}>{STATUS_LABEL[status]}</span>
      </header>

      <p className="app__note">
        Day 1 — Electron + Vite + React 부팅 및 WebSocket echo 확인 화면.
      </p>

      <div className="echo">
        <div className="echo__log">
          {log.length === 0 && (
            <p className="echo__empty">메시지를 보내면 서버가 그대로 echo 합니다.</p>
          )}
          {log.map((entry) => (
            <div key={entry.id} className={`bubble bubble--${entry.kind}`}>
              <span className="bubble__tag">{entry.kind === 'sent' ? '보냄' : 'echo'}</span>
              <span className="bubble__text">{entry.text}</span>
            </div>
          ))}
        </div>
        <div className="echo__input">
          <input
            type="text"
            value={draft}
            placeholder="메시지 입력 후 Enter"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={send} disabled={status !== 'open'}>
            전송
          </button>
        </div>
      </div>

      <footer className="app__footer">
        {appInfo
          ? `${appInfo.name} v${appInfo.version} · ${appInfo.platform} · ws:${appInfo.wsPort}`
          : '앱 정보 로딩 중…'}
      </footer>
    </div>
  );
}
