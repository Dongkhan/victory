import { useMemo, useReducer, useState } from 'react';
import type { CallAlert, MacroTemplate, TodayPatient, TransferFileCard } from './domain/types';
import { CallAlertStack } from './features/alerts/CallAlertStack';
import { FileTransferPanel } from './features/files/FileTransferPanel';
import { parseReservationPaste, toTodayPatients } from './features/import/parseReservationPaste';
import { MacroPanel } from './features/macros/MacroPanel';
import { PatientBoard } from './features/patients/PatientBoard';
import { patientBoardReducer } from './features/patients/patientBoardReducer';

const today = new Date().toISOString().slice(0, 10);

const initialPatients: TodayPatient[] = [
  { id: 'p-1', date: today, name: '홍길동', appointmentTime: '09:30', status: 'waiting', sortOrder: 1 },
  { id: 'p-2', date: today, name: '김영희', appointmentTime: '10:00', status: 'waiting', sortOrder: 2 },
  { id: 'p-3', date: today, name: '박민수', status: 'hold', sortOrder: 3, operationalNote: '접수 확인 필요' }
];

const initialMacros: MacroTemplate[] = [
  { id: 'm-1', title: '들어오세요', template: '{name}님 들어오세요.', color: '#2563eb', sortOrder: 1, target: 'staff', scope: 'common' },
  { id: 'm-2', title: '잠시 대기', template: '{name}님 잠시만 기다려주세요.', color: '#7c3aed', sortOrder: 2, target: 'staff', scope: 'common' },
  { id: 'm-3', title: '검사 먼저', template: '{name}님 검사 먼저 진행해주세요.', color: '#059669', sortOrder: 3, target: 'staff', scope: 'personal' },
  { id: 'm-4', title: '수납 안내', template: '{name}님 수납 안내 부탁드립니다.', color: '#ea580c', sortOrder: 4, target: 'staff', scope: 'personal' }
];

export default function App() {
  const [patients, dispatch] = useReducer(patientBoardReducer, initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0]?.id);
  const [macros, setMacros] = useState(initialMacros);
  const [reservationPaste, setReservationPaste] = useState('09:30 홍길동\n10:00 김영희');
  const [directMessage, setDirectMessage] = useState('{name}님 들어오세요.');
  const [alerts, setAlerts] = useState<CallAlert[]>([]);
  const [files, setFiles] = useState<TransferFileCard[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  function importReservations() {
    const rows = parseReservationPaste(reservationPaste);
    dispatch({ type: 'bulkAdd', patients: toTodayPatients(rows, today) });
  }

  function sendMessage(body: string) {
    if (!selectedPatient) return;
    const now = new Date().toISOString();
    setAlerts((current) => [
      ...current,
      {
        id: `a-${Date.now()}`,
        body,
        patientName: selectedPatient.name,
        sender: '원장실',
        createdAt: now,
        status: 'unread'
      }
    ]);
    dispatch({ type: 'update', id: selectedPatient.id, patch: { lastCalledAt: now, status: 'in_consult' } });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DH-TALK V2 MVP</p>
          <h1>서버컴 없이 쓰는 환자 흐름·호출 보드</h1>
        </div>
        <div className="sync-pill">Local MVP · Supabase 연결 전</div>
      </header>

      <section className="import-panel">
        <div>
          <p className="eyebrow">예약표 붙여넣기</p>
          <textarea value={reservationPaste} onChange={(event) => setReservationPaste(event.target.value)} />
        </div>
        <button type="button" onClick={importReservations}>예약표 추가</button>
        <button type="button" onClick={() => dispatch({ type: 'reset', patients: [] })}>오늘 초기화</button>
      </section>

      <div className="main-grid">
        <PatientBoard
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelect={(patient) => setSelectedPatientId(patient.id)}
          onAdd={(name, appointmentTime) =>
            dispatch({ type: 'add', patient: { date: today, name, appointmentTime, status: 'waiting', operationalNote: '' } })
          }
          onUpdate={(id, patch) => dispatch({ type: 'update', id, patch })}
          onDelete={(id) => dispatch({ type: 'delete', id })}
          onMove={(id, direction) => dispatch({ type: 'move', id, direction })}
        />

        <div className="right-column">
          <MacroPanel
            selectedPatient={selectedPatient}
            macros={macros}
            directMessage={directMessage}
            onDirectMessageChange={setDirectMessage}
            onSend={sendMessage}
            onAddMacro={() =>
              setMacros((current) => [
                ...current,
                {
                  id: `m-${Date.now()}`,
                  title: '새 매크로',
                  template: '{name}님 ',
                  color: '#475569',
                  sortOrder: current.length + 1,
                  target: 'staff',
                  scope: 'personal'
                }
              ])
            }
            onUpdateMacro={(id, patch) => setMacros((current) => current.map((macro) => (macro.id === id ? { ...macro, ...patch } : macro)))}
            onDeleteMacro={(id) => setMacros((current) => current.filter((macro) => macro.id !== id))}
          />
          <FileTransferPanel files={files} onAddFile={(file) => setFiles((current) => [file, ...current])} />
        </div>
      </div>

      <CallAlertStack
        alerts={alerts}
        soundEnabled={soundEnabled}
        onSoundEnabledChange={setSoundEnabled}
        onClose={(id) => setAlerts((current) => current.filter((alert) => alert.id !== id))}
      />
    </main>
  );
}
