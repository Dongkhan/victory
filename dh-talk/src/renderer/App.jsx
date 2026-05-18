import { useEffect, useRef, useState } from 'react';
import MacroGrid from './components/MacroGrid.jsx';
import PatientQueue from './components/PatientQueue.jsx';
import ChatPane from './components/ChatPane.jsx';
import FileDropZone from './components/FileDropZone.jsx';
import DiagnosticsPanel from './components/DiagnosticsPanel.jsx';
import { resolveMacroText, macroTextNeeds, matchesHotkey } from './lib/macro.js';
import { shouldPulse, shouldPulseOnEscalate } from './lib/alert.js';
import { readFileAsDataURL, splitDataUrl, MAX_FILE_BYTES, formatBytes } from './lib/file.js';
import { computeHmac } from './lib/auth.js';

const STATUS_LABEL = {
  connecting: '연결 중…',
  open: '연결됨',
  closed: '연결 끊김',
  error: '오류',
};

function getConnectionIssue({ settings, users, myId, host, status, lastClose }) {
  const sharedKey = settings?.auth?.shared_key || '';
  if (!sharedKey) {
    return {
      level: 'error',
      title: 'shared key 미설정',
      body: '4대 PC의 settings.yaml auth.shared_key에 같은 키를 넣어야 연결됩니다. 이 값은 비워둔 상태로 배포하고, 현장에서 1회 설정합니다.',
      action: '서버 PC에서 npm run key 실행 → 생성된 키를 모든 PC settings.yaml에 동일 입력',
    };
  }
  if (!users.some((u) => u.id === myId)) {
    return {
      level: 'error',
      title: '내 user id가 users.yaml에 없음',
      body: `${myId} 계정이 users.yaml에 등록되어 있지 않아 인증이 실패합니다.`,
      action: 'settings.yaml의 me 값과 users.yaml의 id 목록을 맞추세요.',
    };
  }
  if (lastClose?.code === 4001) {
    return {
      level: 'error',
      title: '인증 실패',
      body: lastClose.reason === 'no shared key' ? '서버 PC의 shared key가 비어 있습니다.' : 'shared key가 서로 다르거나 user id가 서버 허용 목록에 없습니다.',
      action: '서버/클라이언트 settings.yaml의 auth.shared_key와 me 값을 확인하세요.',
    };
  }
  if (status === 'closed' || status === 'error') {
    return {
      level: 'warn',
      title: '서버 연결 실패',
      body: `서버 ${host}에 연결하지 못했습니다. 서버 PC에서 DH Talk이 실행 중인지, 같은 LAN인지, 방화벽이 ws 포트를 막지 않는지 확인하세요.`,
      action: '서버 PC 실행 → 같은 네트워크 확인 → Windows 방화벽 허용 → 진단 버튼 확인',
    };
  }
  return null;
}

export default function App() {
  const [appInfo, setAppInfo] = useState(null);
  const [me, setMe] = useState('');
  const [myRole, setMyRole] = useState('');
  const [macros, setMacros] = useState([]);
  const [patients, setPatients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchResults, setSearchResults] = useState(null); // null = 검색 안 함
  const [status, setStatus] = useState('connecting');
  const [lastReceivedAt, setLastReceivedAt] = useState(null);
  const [lastClose, setLastClose] = useState(null);
  const [connectionIssue, setConnectionIssue] = useState(null);
  const [diag, setDiag] = useState(null);
  const [pendingMacro, setPendingMacro] = useState(null);
  const [promptName, setPromptName] = useState('');
  const [reconnectMeta, setReconnectMeta] = useState(null);
  const [sendError, setSendError] = useState('');

  const wsRef = useRef(null);
  const reconnectNowRef = useRef(() => {});

  useEffect(() => {
    let cancelled = false;
    let ws = null;
    let retry = 0;
    let reconnectTimer = null;
    const cleanups = [];

    const clearReconnectTimer = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
    };

    async function init() {
      const info = await window.dhtalk.getAppInfo();
      const settings = await window.dhtalk.getSettings();
      const users = await window.dhtalk.getUsers();
      if (cancelled) return;

      const myId = settings.me || 'desk1';
      const meUser = users.find((u) => u.id === myId);
      const role = meUser?.role || 'desk';
      const host = meUser?.is_server ? '127.0.0.1' : settings.server?.host || '127.0.0.1';
      const sharedKey = settings.auth?.shared_key || '';
      const initialIssue = getConnectionIssue({ settings, users, myId, host, status: 'connecting', lastClose: null });
      setConnectionIssue(initialIssue);

      setAppInfo(info);
      setMe(myId);
      setMyRole(role);
      setMacros(await window.dhtalk.getMacros());
      setPatients(await window.dhtalk.listPatients());
      setMessages(await window.dhtalk.getRecentMessages());
      if (cancelled) return;
      if (initialIssue?.title === 'shared key 미설정' || initialIssue?.title === '내 user id가 users.yaml에 없음') {
        setStatus('error');
        return;
      }

      const scheduleReconnect = (reason = '연결 끊김') => {
        if (cancelled) return;
        clearReconnectTimer();
        const delay = Math.min(30000, 1000 * 2 ** Math.min(retry, 5));
        retry += 1;
        setReconnectMeta({ reason, delayMs: delay, nextAt: Date.now() + delay });
        reconnectTimer = setTimeout(() => connect(), delay);
      };

      const connect = () => {
        if (cancelled) return;
        clearReconnectTimer();
        if (ws && ws.readyState !== WebSocket.CLOSED) {
          ws.onclose = null;
          ws.onerror = null;
          ws.onmessage = null;
          ws.close();
        }
        setStatus('connecting');
        setReconnectMeta(null);
        const nextWs = new WebSocket(`ws://${host}:${info.wsPort}`);
        ws = nextWs;
        wsRef.current = nextWs;

        // 인증 핸드셰이크: 서버 challenge → HMAC 응답 → authorized 후 'open'
        nextWs.onopen = () => !cancelled && setStatus('connecting');
        nextWs.onclose = (ev) => {
          if (cancelled || wsRef.current !== nextWs) return;
          wsRef.current = null;
          const closeInfo = { code: ev.code, reason: ev.reason || 'reason 없음', at: Date.now() };
          setLastClose(closeInfo);
          const nextStatus = ev.code === 4001 ? 'error' : 'closed';
          setStatus(nextStatus);
          setConnectionIssue(getConnectionIssue({ settings, users, myId, host, status: nextStatus, lastClose: closeInfo }));
          if (ev.code !== 4001) scheduleReconnect(closeInfo.reason);
        };
        nextWs.onerror = () => {
          if (cancelled || wsRef.current !== nextWs) return;
          setStatus('error');
          setConnectionIssue(getConnectionIssue({ settings, users, myId, host, status: 'error', lastClose: null }));
        };
        nextWs.onmessage = (ev) => {
          if (cancelled || wsRef.current !== nextWs) return;
          let msg;
          try {
            msg = JSON.parse(ev.data);
          } catch {
            return;
          }
          if (msg.kind === 'challenge') {
            computeHmac(sharedKey, msg.nonce).then((hmac) => {
              if (!cancelled && nextWs.readyState === WebSocket.OPEN && wsRef.current === nextWs) {
                nextWs.send(JSON.stringify({ kind: 'auth', userId: myId, hmac }));
              }
            });
          } else if (msg.kind === 'authorized') {
            retry = 0;
            setStatus('open');
            setReconnectMeta(null);
            setSendError('');
            setConnectionIssue(null);
          } else if (msg.kind === 'message') {
            setMessages((prev) => [...prev, msg]);
            setLastReceivedAt(Date.now());
            if (shouldPulse(msg, { me: myId, role })) window.dhtalk.showAlert(msg);
          } else if (msg.kind === 'ack') {
            window.dhtalk.closeAlert();
          } else if (msg.kind === 'escalate') {
            if (shouldPulseOnEscalate(msg.original, { me: myId, role })) {
              window.dhtalk.showAlert(msg.original);
            }
          }
        };
      };

      reconnectNowRef.current = () => {
        retry = 0;
        connect();
      };
      connect();

      cleanups.push(
        window.dhtalk.onAlertAcked((m) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ kind: 'ack', id: m.id, by: myId }));
          }
        }),
        window.dhtalk.onAlertEscalateRequest((m) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ kind: 'escalate', id: m.id }));
          }
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
      clearReconnectTimer();
      if (ws) ws.close();
      reconnectNowRef.current = () => {};
      wsRef.current = null;
      cleanups.forEach((fn) => fn?.());
      window.removeEventListener('dragover', preventNav);
      window.removeEventListener('drop', preventNav);
    };
  }, []);

  const currentPatient = patients.find((p) => p.status === 'current') || null;

  const reconnectNow = () => reconnectNowRef.current?.();

  const sendMessage = (payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setSendError('전송 대기: 서버 연결이 복구된 뒤 다시 보내세요. 현재 메시지는 전송되지 않았습니다.');
      return;
    }
    setSendError('');
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
      setSendError('전송 대기: 서버 연결이 복구된 뒤 파일을 다시 보내세요. 현재 파일은 전송되지 않았습니다.');
      return;
    }
    setSendError('');
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

  const openDiagnostics = async () => setDiag(await window.dhtalk.getDiagnostics());

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
        <button
          type="button"
          className="btn btn--ghost btn--sm app__diag"
          onClick={openDiagnostics}
        >
          진단
        </button>
      </header>

      <FileDropZone onFiles={onDropFiles}>
        {connectionIssue && (
          <section className={`connection-banner connection-banner--${connectionIssue.level}`}>
            <strong>{connectionIssue.title}</strong>
            <span>{connectionIssue.body}</span>
            <code>{connectionIssue.action}</code>
            {reconnectMeta && (
              <span className="connection-banner__retry">
                자동 재연결 대기: {Math.ceil(reconnectMeta.delayMs / 1000)}초 · 사유: {reconnectMeta.reason}
              </span>
            )}
            <button type="button" className="btn btn--ghost btn--sm" onClick={reconnectNow}>
              다시 연결
            </button>
          </section>
        )}
        {sendError && (
          <section className="connection-banner connection-banner--warn" aria-live="assertive">
            <strong>전송 실패</strong>
            <span>{sendError}</span>
          </section>
        )}
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

      {diag && (
        <DiagnosticsPanel
          diag={diag}
          status={status}
          lastReceivedAt={lastReceivedAt}
          lastClose={lastClose}
          me={me}
          myRole={myRole}
          onClose={() => setDiag(null)}
        />
      )}
    </div>
  );
}
