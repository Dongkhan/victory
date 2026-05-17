import { useEffect, useRef, useState } from 'react';
import MacroGrid from './components/MacroGrid.jsx';

const STATUS_LABEL = {
  connecting: '연결 중…',
  open: '연결됨',
  closed: '연결 끊김',
  error: '오류',
};

export default function App() {
  const [appInfo, setAppInfo] = useState(null);
  const [macros, setMacros] = useState([]);
  const [status, setStatus] = useState('connecting');

  const wsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let ws = null;
    let offMacros = null;

    async function init() {
      const info = await window.dhtalk.getAppInfo();
      if (cancelled) return;
      setAppInfo(info);
      setMacros(await window.dhtalk.getMacros());

      ws = new WebSocket(`ws://127.0.0.1:${info.wsPort}`);
      wsRef.current = ws;
      ws.onopen = () => !cancelled && setStatus('open');
      ws.onclose = () => !cancelled && setStatus('closed');
      ws.onerror = () => !cancelled && setStatus('error');
    }

    init();
    offMacros = window.dhtalk.onMacrosChanged((next) => !cancelled && setMacros(next));

    return () => {
      cancelled = true;
      if (ws) ws.close();
      wsRef.current = null;
      offMacros?.();
    };
  }, []);

  const triggerMacro = (macro) => {
    // Day 2: 클릭 동작 확인용 콘솔 로그. Day 4 에서 실제 메시지 전송으로 연결한다.
    console.log('[macro]', macro.id, '→', macro.text);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>DH Talk</h1>
        <span className={`status status--${status}`}>{STATUS_LABEL[status]}</span>
      </header>

      <main className="app__main">
        <section className="panel">
          <h2 className="panel__title">매크로</h2>
          <MacroGrid macros={macros} onTrigger={triggerMacro} />
        </section>
      </main>

      <footer className="app__footer">
        {appInfo
          ? `${appInfo.name} v${appInfo.version} · ${appInfo.platform} · ws:${appInfo.wsPort}`
          : '앱 정보 로딩 중…'}
      </footer>
    </div>
  );
}
