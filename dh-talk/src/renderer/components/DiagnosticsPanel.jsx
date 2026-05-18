// 운영 진단 패널 (개선분석 9순위) — 데스크가 연결/경로 문제를 스스로 파악.

const STATUS_LABEL = {
  connecting: '연결 중',
  open: '연결됨',
  closed: '연결 끊김',
  error: '오류',
};

const fmt = (ts) => (ts ? new Date(ts).toLocaleString('ko-KR') : '—');

export default function DiagnosticsPanel({ diag, status, lastReceivedAt, lastClose, me, myRole, onClose }) {
  const rows = [
    ['이 PC', `${me} / ${myRole}`],
    ['역할', diag.isServer ? '서버 (메시지 허브 호스팅)' : '클라이언트'],
    ['서버 주소', `${diag.isServer ? '127.0.0.1 (자체)' : diag.serverHost ?? '?'} : ${diag.wsPort}`],
    ['연결 상태', STATUS_LABEL[status] ?? status],
    ['shared key', diag.sharedKeyConfigured ? '설정됨' : '미설정 — 4대 PC 동일 키 입력 필요'],
    ['마지막 연결 종료', lastClose ? `${fmt(lastClose.at)} · code ${lastClose.code} · ${lastClose.reason}` : '—'],
    ['마지막 메시지 수신', fmt(lastReceivedAt)],
    ['DB 경로', diag.dbPath],
    ['첨부 폴더', diag.attachmentsDir],
    ['설정 폴더', diag.configDir],
    ['보관 기간', `${diag.retentionDays}일`],
    [
      '마지막 정리',
      diag.lastCleanup
        ? `${fmt(diag.lastCleanup.at)} · 메시지 ${diag.lastCleanup.messages} / 폴더 ${diag.lastCleanup.folders}`
        : '아직 실행되지 않음',
    ],
  ];

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__box modal__box--wide">
        <h3>진단 정보</h3>
        <dl className="diag">
          {rows.map(([key, value]) => (
            <div className="diag__row" key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
