import { useEffect, useRef, useState } from 'react';
import MacroGrid from './components/MacroGrid.jsx';
import PatientQueue from './components/PatientQueue.jsx';
import ChatPane from './components/ChatPane.jsx';
import FileDropZone from './components/FileDropZone.jsx';
import { resolveMacroText, macroTextNeeds, matchesHotkey } from './lib/macro.js';
import { shouldPulse, shouldPulseOnEscalate } from './lib/alert.js';
import { readFileAsDataURL, splitDataUrl, MAX_FILE_BYTES, formatBytes } from './lib/file.js';

const STATUS_LABEL = {
  connecting: '연결 중…',
  open: '연결됨',
  closed: '연결 끊김',
  error: '오류',
};

function ElectronOnlyFallback() {
  return (
    <div className="app app--fallback">
      <main className="fallback panel">
        <h1>DH Talk은 Electron 앱에서 실행해야 합니다</h1>
        <p>
          브라우저에서 dist 파일만 열면 환자 큐, DB, LAN 메시지 API가 제공되지 않습니다. Windows PC에서는
          <code> npm run start </code> 또는 배포된 DH Talk 실행 파일로 열어주세요.
        </p>
        <p className="modal__hint">이 화면은 blank page 대신 표시되는 안전 fallback입니다.</p>
      </main>
    </div>
  );
}

export default function App() {
  if (!window.dhtalk) return <ElectronOnlyFallback />;

  const [appInfo, setAppInfo] = useState(null);
  const [me, setMe] = useState('');
  const [myRole, setMyRole] = useState('');
  const [macros, setMacros] = useState([]);
  const [patients, setPatients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchResults, setSearchResults] = useState(null); // null = 검색 안 함
  const [status, setStatus] = useState('connecting');
  const [pendingMacro, setPendingMacro] = useState(null);
  const [promptName, setPromptName] = useState('');

  const wsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let ws = null;
    const cleanups = [];

    async function init() {
      const info = await window.dhtalk.getAppInfo();
      const settings = await window.dhtalk.getSettings();
      const users = await window.dhtalk.getUsers();
      if (cancelled) return;

      const myId = settings.me || 'desk1';
      const meUser = users.find((u) => u.id === myId);
      const role = meUser?.role || 'desk';
      const host = meUser?.is_server ? '127.0.0.1' : settings.server?.host || '127.0.0.1';

      setAppInfo(info);
      setMe(myId);
      setMyRole(role);
      setMacros(await window.dhtalk.getMacros());
      setPatients(await window.dhtalk.listPatients());
      setMessages(await window.dhtalk.getRecentMessages());
      if (cancelled) return;

      ws = new WebSocket(`ws://${host}:${info.wsPort}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        ws.send(JSON.stringify({ kind: 'hello', userId: myId, token: settings.server?.shared_key || '' }));
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
        if (msg.kind === 'message') {
          setMessages((prev) => [...prev, msg]);
          if (shouldPulse(msg, { me: myId, role })) window.dhtalk.showAlert(msg);
        } else if (msg.kind === 'ack') {
          window.dhtalk.closeAlert();
        } else if (msg.kind === 'escalate') {
          if (shouldPulseOnEscalate(msg.original, { me: myId, role })) {
            window.dhtalk.showAlert(msg.original);
          }
        }
      };

      cleanups.push(
        window.dhtalk.onAlertAcked((m) => {
          wsRef.current?.send(JSON.stringify({ kind: 'ack', id: m.id, by: myId }));
        }),
        window.dhtalk.onAlertEscalateRequest((m) => {
          wsRef.current?.send(JSON.stringify({ kind: 'escalate', id: m.id, original: m }));
        }),
      );
    }

    init();
    cleanups.push(
      window.dhtalk.onMacrosChanged((next) => !cancelled && setMacros(next)),
      window.dhtalk.onPatientsReset(async () => {
        if (!cancelled) setPatients(await window.dhtalk.listPatients());
      }),
    );

    // OS 파일을 드롭존 밖에 떨어뜨렸을 때 Electron 이 그 파일로 이동하는 것을 막는다.
    const preventNav = (e) => e.preventDefault();
    window.addEventListener('dragover', preventNav);
    window.addEventListener('drop', preventNav);

    return () => {
      cancelled = true;
      if (ws) ws.close();
      wsRef.current = null;
      cleanups.forEach((fn) => fn?.());
      window.removeEventListener('dragover', preventNav);
      window.removeEventListener('drop', preventNav);
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

  const sendFile = async (file) => {
    if (file.size > MAX_FILE_BYTES) {
      window.alert(`파일이 5MB를 초과합니다 (${formatBytes(file.size)}): ${file.name}`);
      return;
    }
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[ws] 연결되지 않아 파일을 전송할 수 없습니다.');
      return;
    }
    const { mime, base64 } = splitDataUrl(await readFileAsDataURL(file));
    ws.send(
      JSON.stringify({
        kind: 'file',
        ts: Date.now(),
        sender: me,
        recipient: 'all',
        filename: file.name || 'pasted-image.png',
        mime,
        dataBase64: base64,
      }),
    );
  };

  const onDropFiles = (files) => files.forEach(sendFile);

  const onSearch = async (query) => {
    if (!query) {
      setSearchResults(null);
      return;
    }
    setSearchResults(await window.dhtalk.searchMessages(query));
  };

  const triggerMacro = async (macro) => {
    let patientName = currentPatient?.name ?? '';

    if (macro.action_after === 'advance_queue') {
      const result = await window.dhtalk.advancePatients();
      setPatients(result.list);
      patientName = result.current?.name ?? '';
    }

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

      <FileDropZone onFiles={onDropFiles}>
        <main className="app__main">
          <PatientQueue
            patients={patients}
            onBulkAdd={bulkAdd}
            onAddWalkin={addWalkin}
            onAdvance={advance}
            onClear={clearQueue}
          />
          <section className="workspace">
            <ChatPane
              messages={searchResults ?? messages}
              me={me}
              isSearching={searchResults !== null}
              onSendText={sendText}
              onSendFile={sendFile}
              onSearch={onSearch}
            />
            <div className="macros-bar panel">
              <h2 className="panel__title">매크로</h2>
              <MacroGrid macros={macros} onTrigger={triggerMacro} />
            </div>
          </section>
        </main>
      </FileDropZone>

      <footer className="app__footer">
        {appInfo
          ? `${appInfo.name} v${appInfo.version} · ${appInfo.platform} · ${me}/${myRole} · ws:${appInfo.wsPort}`
          : '앱 정보 로딩 중…'}
      </footer>

      {pendingMacro && (
        <div
          className="modal"
          onClick={(e) => e.target === e.currentTarget && setPendingMacro(null)}
        >
          <div className="modal__box">
            <h3>환자 이름 입력</h3>
            <p className="modal__hint">진료중인 환자가 없습니다. 호출할 환자 이름을 입력하세요.</p>
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
