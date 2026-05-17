import { useEffect, useRef, useState } from 'react';
import MacroGrid from './components/MacroGrid.jsx';
import PatientQueue from './components/PatientQueue.jsx';

const STATUS_LABEL = {
  connecting: '연결 중…',
  open: '연결됨',
  closed: '연결 끊김',
  error: '오류',
};

export default function App() {
  const [appInfo, setAppInfo] = useState(null);
  const [macros, setMacros] = useState([]);
  const [patients, setPatients] = useState([]);
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
      setPatients(await window.dhtalk.listPatients());

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

  const currentPatient = patients.find((p) => p.status === 'current') || null;

  const bulkAdd = async (text) => setPatients(await window.dhtalk.bulkAddPatients(text));
  const addWalkin = async (name) => setPatients(await window.dhtalk.addWalkin(name));
  const clearQueue = async () => setPatients(await window.dhtalk.clearPatients());
  const advance = async () => {
    const result = await window.dhtalk.advancePatients();
    setPatients(result.list);
    if (result.exhausted) console.log('[queue] 대기 환자가 없습니다.');
  };

  const triggerMacro = (macro) => {
    // Day 3: 매크로 클릭 확인용 콘솔 로그. Day 4 에서 메시지 전송 + advance 연결.
    console.log('[macro]', macro.id, '→', macro.text, '| 현재 환자:', currentPatient?.name ?? '없음');
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>DH Talk</h1>
        <span className={`status status--${status}`}>{STATUS_LABEL[status]}</span>
      </header>

      <main className="app__main">
        <PatientQueue
          patients={patients}
          onBulkAdd={bulkAdd}
          onAddWalkin={addWalkin}
          onAdvance={advance}
          onClear={clearQueue}
        />
        <section className="panel panel--grow">
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
