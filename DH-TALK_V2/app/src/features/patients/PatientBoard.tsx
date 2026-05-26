import { useEffect, useState, type ChangeEvent } from 'react';
import type { PatientStatus, TodayPatient } from '../../domain/types';

const statusLabels: Record<PatientStatus, string> = {
  waiting: '대기',
  in_consult: '진료중',
  done: '완료',
  hold: '보류',
  no_show: '노쇼'
};

interface PatientBoardProps {
  patients: TodayPatient[];
  selectedPatientId?: string;
  loading?: boolean;
  error?: string | null;
  mutationError?: string | null;
  onSelect: (patient: TodayPatient) => void;
  onAdd: (name: string, appointmentTime?: string) => void;
  onUpdate: (id: string, patch: Partial<TodayPatient>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

export function PatientBoard({
  patients,
  selectedPatientId,
  loading = false,
  error = null,
  mutationError = null,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
  onMove
}: PatientBoardProps) {
  const ordered = [...patients].sort((a, b) => a.sortOrder - b.sortOrder);

  function handleQuickAdd(event: ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const appointmentTime = String(form.get('appointmentTime') ?? '').trim();
    if (!name) return;
    onAdd(name, appointmentTime || undefined);
    event.currentTarget.reset();
  }

  return (
    <section className="panel patient-board">
      <div className="panel-header">
        <div>
          <p className="eyebrow">오늘 환자</p>
          <h2>대기 흐름 보드</h2>
        </div>
        <span className="count-badge">{patients.length}명</span>
      </div>

      {loading ? <p className="sync-note" role="status">환자 목록을 불러오는 중입니다.</p> : null}
      {error ? <p className="sync-error" role="alert">원격 불러오기 실패, 로컬 캐시를 표시 중입니다: {error}</p> : null}
      {mutationError ? <p className="sync-error" role="alert">{mutationError}</p> : null}

      <form className="quick-add" onSubmit={handleQuickAdd}>
        <input name="appointmentTime" placeholder="시간" aria-label="예약 시간" />
        <input name="name" placeholder="예약 없는 환자 추가" aria-label="환자명" />
        <button type="submit">추가</button>
      </form>

      <div className="patient-list">
        {ordered.map((patient, index) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            selected={selectedPatientId === patient.id}
            first={index === 0}
            last={index === ordered.length - 1}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  );
}

interface PatientCardProps {
  patient: TodayPatient;
  selected: boolean;
  first: boolean;
  last: boolean;
  onSelect: (patient: TodayPatient) => void;
  onUpdate: (id: string, patch: Partial<TodayPatient>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

function PatientCard({ patient, selected, first, last, onSelect, onUpdate, onDelete, onMove }: PatientCardProps) {
  const [noteDraft, setNoteDraft] = useState(patient.operationalNote ?? '');

  useEffect(() => {
    setNoteDraft(patient.operationalNote ?? '');
  }, [patient.id, patient.operationalNote]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (noteDraft !== (patient.operationalNote ?? '')) {
        onUpdate(patient.id, { operationalNote: noteDraft });
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [noteDraft, onUpdate, patient.id, patient.operationalNote]);

  return (
    <article
      className={`patient-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(patient)}
    >
      <div className="patient-card-main">
        <strong>{patient.name}</strong>
        <span>{patient.appointmentTime || '예약 없음'}</span>
        {patient.syncState === 'pending' ? <small className="sync-note">로컬 임시 저장</small> : null}
      </div>
      <select
        value={patient.status}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onUpdate(patient.id, { status: event.target.value as PatientStatus })}
        aria-label={`${patient.name} 상태`}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <input
        value={noteDraft}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setNoteDraft(event.target.value)}
        onBlur={() => {
          if (noteDraft !== (patient.operationalNote ?? '')) onUpdate(patient.id, { operationalNote: noteDraft });
        }}
        placeholder="운영 메모만"
        aria-label={`${patient.name} 운영 메모`}
      />
      <div className="card-actions" onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label={`${patient.name} 위로 이동`} onClick={() => onMove(patient.id, 'up')} disabled={first}>↑</button>
        <button type="button" aria-label={`${patient.name} 아래로 이동`} onClick={() => onMove(patient.id, 'down')} disabled={last}>↓</button>
        <button type="button" className="danger wide-action" aria-label={`${patient.name} 삭제`} onClick={() => onDelete(patient.id)}>삭제</button>
      </div>
    </article>
  );
}
