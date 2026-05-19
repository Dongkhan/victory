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
  const [statusDetail, setStatusDetail] = useState('서버 연결을 준비 중입니다.');
  const [settingsDraft, setSettingsDraft] = useState({ host: '', sharedKey: '' });
  const [showSharedKey, setShowSharedKey] = useState(false);
  const [connectionDiagnostics, setConnectionDiagnostics] = useState([]);
  const [pendingMacro, setPendingMacro] = useState(null);
  const [promptName, setPromptName] = useState('');

  const wsRef = useRef(null);

  const connectWebSocket = ({ host, sharedKey, myId, info, role, sharedKeyNeedsSetup }) => {
    const socket = new WebSocket(`ws://${host}:${info.wsPort}`);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ kind: 'hello', userId: myId, token: sharedKey }));
      setStatus('open');
      setStatusDetail(
        sharedKeyNeedsSetup
          ? '서버에는 연결됐지만 기본 공유키 상태입니다. 실사용 전 shared_key 교체가 필요합니다.'
          : '인증 요청을 보냈습니다.',
      );
    };
    socket.onclose = (ev) => {
      setStatus('closed');
      if (ev.code === 1008) setStatusDetail('인증 실패 또는 정책 위반으로 연결이 종료되었습니다. 공유키와 users.yaml을 확인하세요.');
      else setStatusDetail('연결 실패 또는 서버 종료 상태입니다. 데스크1 서버 앱, IP, 방화벽을 확인하세요.');
    };
    socket.onerror = () => {
      setStatus('error');
      setStatusDetail('연결 실패: 서버 IP, 포트, Windows 방화벽, shared_key 설정을 확인하세요.');
    };
    socket.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.kind === 'error') {
        setStatus('error');
        const reason = msg.code === 'auth_failed' ? 'auth_failed: 공유키가 일치하지 않습니다.' : msg.reason;
        setStatusDetail(reason || '서버 오류가 발생했습니다.');
      } else if (msg.kind === 'hello_ack') {
        setStatus('open');
        setStatusDetail(`${msg.userId} 인증 완료`);
      } else if (msg.kind === 'message') {
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
    return socket;
  };

  const reconnectAfterSettingsSave = (saved) => {
    if (!appInfo || !me) return;
    wsRef.current?.close();
    const nextHost = saved.server?.host || settingsDraft.host.trim() || '127.0.0.1';
    const nextSharedKey = String(saved.server?.shared_key || '').trim();
    const sharedKeyNeedsSetup = !nextSharedKey || nextSharedKey === 'CHANGE_ME_BEFORE_USE';
    setStatus('connecting');
    setStatusDetail(`설정 저장 후 재연결: ${nextHost}:${appInfo.wsPort}`);
    connectWebSocket({ host: nextHost, sharedKey: nextSharedKey, myId: me, info: appInfo, role: myRole, sharedKeyNeedsSetup });
  };

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
      const sharedKey = String(settings.server?.shared_key || '').trim();
      const sharedKeyNeedsSetup = !sharedKey || sharedKey === 'CHANGE_ME_BEFORE_USE';

      setAppInfo(info);
      setMe(myId);
      setMyRole(role);
      setSettingsDraft({ host, sharedKey });
      setMacros(await window.dhtalk.getMacros());
      setPatients(await window.dhtalk.listPatients());
      setMessages(await window.dhtalk.getRecentMessages());
      setStatusDetail(
        sharedKeyNeedsSetup
          ? '공유키를 설정해야 합니다. config/settings.yaml의 server.shared_key를 모든 PC에서 같은 무작위 문자열로 바꾸세요.'
          : `${host}:${info.wsPort} 연결 시도 중`,
      );
      if (cancelled) return;

      ws = connectWebSocket({ host, sharedKey, myId, info, role, sharedKeyNeedsSetup });

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

  const diagnosticSeverity = ({ host, sharedKey }) => {
    if (!host || host === '127.0.0.1') return 'warn';
    if (sharedKey.length < 20 || sharedKey === 'CHANGE_ME_BEFORE_USE') return 'error';
    if (status === 'error') return 'error';
    if (status !== 'open') return 'warn';
    return 'ok';
  };

  const diagnosticFixGuide = ({ host, sharedKey }) => {
    if (!host || host === '127.0.0.1') return '주의: 접수/진료실 분리 PC에서는 서버 PC의 LAN IP를 입력하세요.';
    if (sharedKey.length < 20 || sharedKey === 'CHANGE_ME_BEFORE_USE') return '오류: 모든 PC에 같은 공유키를 20자 이상 무작위 문자열로 저장하세요.';
    if (status === 'error') return '오류: 서버 실행, IP/포트, Windows 방화벽, 같은 공유키 여부를 확인하세요.';
    if (status !== 'open') return '주의: WebSocket 연결 대기 중입니다. 서버와 같은 네트워크인지 확인하세요.';
    return '정상: 서버 IP, 공유키, WebSocket 연결이 실사용 조건을 만족합니다.';
  };

  const runConnectionDiagnostics = () => {
    const host = settingsDraft.host.trim() || '127.0.0.1';
    const sharedKey = settingsDraft.sharedKey.trim();
    const severity = diagnosticSeverity({ host, sharedKey });
    const label = severity === 'ok' ? '정상' : severity === 'warn' ? '주의' : '오류';
    const rows = [
      { label: `서버 IP: ${host}`, severity: host === '127.0.0.1' ? 'warn' : 'ok' },
      { label: `공유키: ${sharedKey.length >= 20 ? '20자 이상 설정됨' : '20자 미만 또는 기본값'}`, severity: sharedKey.length >= 20 ? 'ok' : 'error' },
      { label: `WebSocket: ${status === 'open' ? '연결됨' : statusDetail}`, severity: status === 'open' ? 'ok' : status === 'error' ? 'error' : 'warn' },
      { label: `역할/사용자: ${me || '미확인'} / ${myRole || '미확인'}`, severity: me ? 'ok' : 'warn' },
      { label: `${label}: ${diagnosticFixGuide({ host, sharedKey })}`, severity },
    ];
    setConnectionDiagnostics(rows);
    setStatusDetail('설정 진단을 갱신했습니다. 서버 IP, 공유키, WebSocket 상태와 해결 가이드를 확인하세요.');
  };

  const saveConnectionSettings = async () => {
    const sharedKey = settingsDraft.sharedKey.trim();
    if (sharedKey.length < 20) {
      setStatus('error');
      setStatusDetail('새 공유키는 20자 이상이어야 합니다. 모든 PC에 같은 값을 저장하세요.');
      return;
    }
    const saved = await window.dhtalk.saveSettings({
      server: { host: settingsDraft.host.trim() || '127.0.0.1', shared_key: sharedKey },
    });
    setSettingsDraft({ host: saved.server?.host || '127.0.0.1', sharedKey: saved.server?.shared_key || '' });
    setStatusDetail('공유키 저장 후 자동 재연결을 시작합니다. 모든 PC에는 같은 값을 저장하세요.');
    reconnectAfterSettingsSave(saved);
  };

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
        <span className="app__status-detail">{statusDetail}</span>
        <div className="app__settings">
          <input
            aria-label="서버 IP"
            value={settingsDraft.host}
            onChange={(e) => setSettingsDraft((prev) => ({ ...prev, host: e.target.value }))}
            placeholder="서버 IP"
          />
          <input
            aria-label="새 공유키"
            value={settingsDraft.sharedKey}
            onChange={(e) => setSettingsDraft((prev) => ({ ...prev, sharedKey: e.target.value }))}
            placeholder="새 공유키 20자 이상"
            type={showSharedKey ? 'text' : 'password'}
          />
          <button type="button" onClick={() => setShowSharedKey((value) => !value)}>{showSharedKey ? '공유키 숨김' : '공유키 표시'}</button>
          <button type="button" onClick={saveConnectionSettings}>공유키 저장</button>
          <button type="button" onClick={runConnectionDiagnostics}>설정 진단</button>
          <small className="app__settings-hint">공유키 저장 후 자동 재연결</small>
        </div>
        <div className="app__diagnostics" aria-label="설정 진단 결과">
          {(connectionDiagnostics.length ? connectionDiagnostics : [{ label: '서버 IP, 공유키, WebSocket 상태를 설정 진단 버튼으로 확인하세요.', severity: 'warn' }]).map((item) => (
            <span key={item.label} className={`app__diagnostic app__diagnostic--${item.severity}`}>{item.label}</span>
          ))}
        </div>
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
