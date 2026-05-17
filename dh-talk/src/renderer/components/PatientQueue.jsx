import { useState } from 'react';

// 좌측 사이드바 — 오늘의 환자 큐.
const STATUS_META = {
  current: { label: '진료중', cls: 'current' },
  waiting: { label: '대기', cls: 'waiting' },
  done: { label: '완료', cls: 'done' },
};

export default function PatientQueue({ patients, onBulkAdd, onAddWalkin, onAdvance, onClear }) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [walkin, setWalkin] = useState('');

  const waitingCount = patients.filter((p) => p.status === 'waiting').length;

  const submitPaste = () => {
    if (pasteText.trim()) onBulkAdd(pasteText);
    setPasteText('');
    setShowPaste(false);
  };

  const submitWalkin = () => {
    const name = walkin.trim();
    if (!name) return;
    onAddWalkin(name);
    setWalkin('');
  };

  return (
    <aside className="queue panel">
      <div className="queue__head">
        <h2 className="panel__title">환자 큐</h2>
        <span className="queue__count">대기 {waitingCount}</span>
      </div>

      <div className="queue__actions">
        <button type="button" className="btn btn--sm" onClick={() => setShowPaste(true)}>
          명단 붙여넣기
        </button>
        <button type="button" className="btn btn--sm" onClick={onAdvance}>
          다음 ▸
        </button>
      </div>

      <ul className="queue__list">
        {patients.length === 0 && <li className="queue__empty">큐가 비어 있습니다.</li>}
        {patients.map((p) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.waiting;
          return (
            <li key={p.id} className={`patient patient--${meta.cls}`}>
              <span className="patient__time">{p.scheduled_time || '—'}</span>
              <span className="patient__name">{p.name}</span>
              {p.is_walkin ? <span className="patient__tag">워크인</span> : null}
              <span className="patient__status">{meta.label}</span>
            </li>
          );
        })}
      </ul>

      <div className="queue__walkin">
        <input
          type="text"
          value={walkin}
          placeholder="+ 환자 추가 후 Enter"
          onChange={(e) => setWalkin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitWalkin()}
        />
      </div>

      {patients.length > 0 && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>
          큐 비우기
        </button>
      )}

      {showPaste && (
        <div
          className="modal"
          onClick={(e) => e.target === e.currentTarget && setShowPaste(false)}
        >
          <div className="modal__box">
            <h3>명단 붙여넣기</h3>
            <p className="modal__hint">
              한 줄에 한 명. 예: <code>09:00 김OO</code> · <code>김OO 09:00</code> · <code>김OO</code>
            </p>
            <textarea
              value={pasteText}
              autoFocus
              rows={10}
              placeholder={'09:00\t김OO\n09:20\t이OO\n홍OO'}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setShowPaste(false)}>
                취소
              </button>
              <button type="button" className="btn" onClick={submitPaste}>
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
