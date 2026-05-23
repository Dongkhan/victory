import type { ChangeEvent } from 'react';
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
  onSelect: (patient: TodayPatient) => void;
  onAdd: (name: string, appointmentTime?: string) => void;
  onUpdate: (id: string, patch: Partial<TodayPatient>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

export function PatientBoard({
  patients,
  selectedPatientId,
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

      <form className="quick-add" onSubmit={handleQuickAdd}>
        <input name="appointmentTime" placeholder="시간" aria-label="예약 시간" />
        <input name="name" placeholder="예약 없는 환자 추가" aria-label="환자명" />
        <button type="submit">추가</button>
      </form>

      <div className="patient-list">
        {ordered.map((patient, index) => (
          <article
            className={`patient-card ${selectedPatientId === patient.id ? 'selected' : ''}`}
            key={patient.id}
            onClick={() => onSelect(patient)}
          >
            <div className="patient-card-main">
              <strong>{patient.name}</strong>
              <span>{patient.appointmentTime || '예약 없음'}</span>
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
              value={patient.operationalNote ?? ''}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate(patient.id, { operationalNote: event.target.value })}
              placeholder="운영 메모만"
              aria-label={`${patient.name} 운영 메모`}
            />
            <div className="card-actions" onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={() => onMove(patient.id, 'up')} disabled={index === 0}>↑</button>
              <button type="button" onClick={() => onMove(patient.id, 'down')} disabled={index === ordered.length - 1}>↓</button>
              <button type="button" className="danger" onClick={() => onDelete(patient.id)}>삭제</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
