import { useEffect, useRef, useState } from 'react';
import SearchBar from './SearchBar.jsx';
import { isImageMime } from '../lib/file.js';

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

function MessageBody({ m }) {
  if (m.type === 'file') {
    if (m.dataBase64 && isImageMime(m.mime)) {
      return (
        <img className="msg__image" src={`data:${m.mime};base64,${m.dataBase64}`} alt={m.body} />
      );
    }
    return (
      <div className="msg__file">
        <span aria-hidden>📎</span>
        <span className="msg__file-name">{m.body}</span>
      </div>
    );
  }
  return <div className="msg__body">{m.body}</div>;
}

// 중앙 대화 영역 — 검색 + 메시지 목록 + 텍스트/이미지 입력.
export default function ChatPane({ messages, me, isSearching, onSendText, onSendFile, onSearch }) {
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!isSearching) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isSearching]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    onSendText(body);
    setDraft('');
  };

  // 입력창에 이미지 붙여넣기 → 파일 전송
  const onPaste = (e) => {
    for (const item of e.clipboardData?.items || []) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          onSendFile(file);
        }
      }
    }
  };

  return (
    <div className="chat panel panel--grow">
      <div className="chat__head">
        <h2 className="panel__title">대화</h2>
        <SearchBar onSearch={onSearch} />
      </div>

      <div className="chat__log">
        {isSearching && <p className="chat__searchnote">검색 결과 {messages.length}건</p>}
        {messages.length === 0 && (
          <p className="chat__empty">
            {isSearching ? '검색 결과가 없습니다.' : '아직 메시지가 없습니다.'}
          </p>
        )}
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
            <MessageBody m={m} />
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="chat__input">
        <input
          type="text"
          value={draft}
          placeholder="메시지 입력 후 Enter · 이미지 붙여넣기 가능"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          onPaste={onPaste}
        />
        <button type="button" className="btn" onClick={send}>
          전송
        </button>
      </div>
    </div>
  );
}
