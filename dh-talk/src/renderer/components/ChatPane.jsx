import { useEffect, useRef, useState } from 'react';

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

// 중앙 대화 영역 — 메시지 목록 + 텍스트 입력.
export default function ChatPane({ messages, me, onSendText }) {
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    onSendText(body);
    setDraft('');
  };

  return (
    <div className="chat panel panel--grow">
      <h2 className="panel__title">대화</h2>

      <div className="chat__log">
        {messages.length === 0 && <p className="chat__empty">아직 메시지가 없습니다.</p>}
        {messages.map((m) => (
          <div
            key={m.id ?? `${m.ts}-${m.sender}`}
            className={[
              'msg',
              m.sender === me ? 'msg--mine' : '',
              m.type === 'macro' ? 'msg--macro' : '',
              m.alert_level ? 'msg--alert' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="msg__meta">
              <span className="msg__sender">{m.sender}</span>
              <time>{fmtTime(m.ts)}</time>
            </div>
            <div className="msg__body">{m.body}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="chat__input">
        <input
          type="text"
          value={draft}
          placeholder="메시지 입력 후 Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button type="button" className="btn" onClick={send}>
          전송
        </button>
      </div>
    </div>
  );
}
