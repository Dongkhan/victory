import { useEffect, useRef, useState } from 'react';
import MacroGrid from './components/MacroGrid.jsx';
import PatientQueue from './components/PatientQueue.jsx';
import ChatPane from './components/ChatPane.jsx';
import { resolveMacroText, macroTextNeeds, matchesHotkey } from './lib/macro.js';

const STATUS_LABEL = {
  connecting: '연결 중…',
  open: '연결됨',
  closed: '연결 끊김',
  error: '오류',
};

export default function App() {
  const [appInfo, setAppInfo] = useState(null);
  const [me, setMe] = useState('');
  const [macros, setMacros] = useState([]);
  const [patients, setPatients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [pendingMacro, setPendingMacro] = useState(null);
  const [promptName, setPromptName] = useState('');

  const wsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let ws = null;
    let offMacros = null;

    async function init() {
      const info = await window.dhtalk.getAppInfo();
      const settings = await window.dhtalk.getSettings();
      const users = await window.dhtalk.getUsers();
      if (cancelled) return;

      const myId = settings.me || 'desk1';
      const meIsServer = users.find((u) => u.id === myId)?.is_server || false;
      const host = meIsServer ? '127.0.0.1' : settings.server?.host || '127.0.0.1';

      setAppInfo(info);
      setMe(myId);
      setMacros(await window.dhtalk.getMacros());
      setPatients(await window.dhtalk.listPatients());
      setMessages(await window.dhtalk.getRecentMessages());
      if (cancelled) return;

      ws = new WebSocket(`ws://${host}:${info.wsPort}`);
      wsRef.current = ws;
      ws.onopen = () => {
        if (cancelled) return;
        ws.send(JSON.stringify({ kind: 'hello', userId: myId }));
        setStatus('open');
      };
      ws.onclose = () => !cancelled && setStatus('closed');
      ws.onerror = () => !cancelled && setStatus('error');
      ws.onmessage = (ev) => {
        if (cancelled) return;
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg.kind === 'message') setMessages((prev) => [...prev, msg]);
      };
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

  const sendMessage = (payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[ws] 연결되지 않아 전송할 수 없습니다.');
      return;
    }
    ws.send(JSON.stringify({ kind: 'message', ts: Date.now(), recipient: 'all', ...payload }));
  };

  const sendText = (body) => sendMessage({ sender: me, type: 'text', body });

  const sendMacro = (macro, patientName) =>
    sendMessage({
      sender: me,
      type: 'macro',
      body: resolveMacroText(macro.text, { patient: patientName }),
      patient_name: patientName || null,
      alert_level: macro.alert_level ?? null,
      mirror_to: macro.mirror_to ?? null,
    });

  const triggerMacro = async (macro) => {
    let patientName = currentPatient?.name ?? '';

    // action_after: advance_queue — 큐를 먼저 진행시킨 뒤 새 current 환자로 치환.
    if (macro.action_after === 'advance_queue') {
      const result = await window.dhtalk.advancePatients();
      setPatients(result.list);
      patientName = result.current?.name ?? '';
    }

    // {patient} 가 필요한데 현재 환자가 없으면 이름 입력 모달.
    if (macroTextNeeds(macro.text, 'patient') && !patientName) {
      setPromptName('');
      setPendingMacro(macro);
      return;
    }

    sendMacro(macro, patientName);
  };

  const confirmPrompt = () => {
    const name = promptName.trim();
    if (name && pendingMacro) sendMacro(pendingMacro, name);
    setPendingMacro(null);
    setPromptName('');
  };

  // 핫키 — in-app(창 포커스 시에만), globalShortcut 미사용 (CLAUDE.md §7).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const macro = macros.find((m) => matchesHotkey(m.hotkey, e));
      if (macro) {
        e.preventDefault();
        triggerMacro(macro);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // macros/patients/me 가 바뀌면 최신 클로저로 다시 바인딩
  }, [macros, patients, me]);

  const bulkAdd = async (text) => setPatients(await window.dhtalk.bulkAddPatients(text));
  const addWalkin = async (name) => setPatients(await window.dhtalk.addWalkin(name));
  const clearQueue = async () => setPatients(await window.dhtalk.clearPatients());
  const advance = async () => {
    const result = await window.dhtalk.advancePatients();
    setPatients(result.list);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>DH Talk</h1>
        {me && <span className="app__me">{me}</span>}
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
        <section className="workspace">
          <ChatPane messages={messages} me={me} onSendText={sendText} />
          <div className="macros-bar panel">
            <h2 className="panel__title">매크로</h2>
            <MacroGrid macros={macros} onTrigger={triggerMacro} />
          </div>
        </section>
      </main>

      <footer className="app__footer">
        {appInfo
          ? `${appInfo.name} v${appInfo.version} · ${appInfo.platform} · ws:${appInfo.wsPort}`
          : '앱 정보 로딩 중…'}
      </footer>

      {pendingMacro && (
        <div
          className="modal"
          onClick={(e) => e.target === e.currentTarget && setPendingMacro(null)}
        >
          <div className="modal__box">
            <h3>환자 이름 입력</h3>
            <p className="modal__hint">
              진료중인 환자가 없습니다. 호출할 환자 이름을 입력하세요.
            </p>
            <input
              className="modal__input"
              type="text"
              autoFocus
              value={promptName}
              placeholder="환자 이름"
              onChange={(e) => setPromptName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmPrompt()}
            />
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setPendingMacro(null)}>
                취소
              </button>
              <button type="button" className="btn" onClick={confirmPrompt}>
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
