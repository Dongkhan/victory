import { useEffect, useMemo, useState } from 'react';
import type { CallAlert, MacroTemplate, TodayPatient, TransferFileCard } from './domain/types';
import { createLocalPatientRepository, createSupabasePatientRepository } from './data/patientRepository';
import { subscribeToPatientChanges } from './data/patientRealtime';
import { CallAlertStack } from './features/alerts/CallAlertStack';
import { FileTransferPanel } from './features/files/FileTransferPanel';
import { parseReservationPaste, toTodayPatients } from './features/import/parseReservationPaste';
import { MacroPanel } from './features/macros/MacroPanel';
import { PatientBoard } from './features/patients/PatientBoard';
import { usePatientBoard } from './features/patients/usePatientBoard';
import { supabase } from './lib/supabaseClient';
import { useLocalStorageState } from './lib/useLocalStorageState';

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
  const [initialStoredPatients] = useState(() => readLocalStorageState('dh-talk-v2:patients', initialPatients));
  const patientRepository = useMemo(
    () => (supabase ? createSupabasePatientRepository(supabase) : createLocalPatientRepository(initialStoredPatients)),
    [initialStoredPatients]
  );
  const {
    patients,
    addPatient,
    bulkAddPatients,
    updatePatient,
    deletePatient,
    movePatient,
    resetPatients,
    refresh
  } = usePatientBoard({ date: today, repository: patientRepository, fallbackPatients: initialStoredPatients });
  const [selectedPatientId, setSelectedPatientId] = useState(initialStoredPatients[0]?.id);
  const [macros, setMacros] = useLocalStorageState<MacroTemplate[]>('dh-talk-v2:macros', initialMacros);
  const [reservationPaste, setReservationPaste] = useState('09:30 홍길동\n10:00 김영희');
  const [directMessage, setDirectMessage] = useState('{name}님 들어오세요.');
  const [alerts, setAlerts] = useLocalStorageState<CallAlert[]>('dh-talk-v2:alerts', []);
  const [files, setFiles] = useLocalStorageState<TransferFileCard[]>('dh-talk-v2:files', []);
  const [soundEnabled, setSoundEnabled] = useLocalStorageState<boolean>('dh-talk-v2:sound-enabled', false);
  const syncMode = supabase ? 'Supabase 준비됨 · Realtime 연결 예정' : 'Local 저장 모드 · Supabase 키 없음';

  useEffect(() => {
    writeLocalStorageState('dh-talk-v2:patients', patients);
  }, [patients]);

  useEffect(() => {
    if (!supabase) return undefined;
    return subscribeToPatientChanges(supabase, today, () => {
      void refresh();
    });
  }, [refresh]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  async function importReservations() {
    const rows = parseReservationPaste(reservationPaste);
    await bulkAddPatients(toTodayPatients(rows, today));
  }

  async function sendMessage(body: string) {
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
    await updatePatient(selectedPatient.id, { lastCalledAt: now, status: 'in_consult' });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DH-TALK V2 MVP</p>
          <h1>서버컴 없이 쓰는 환자 흐름·호출 보드</h1>
        </div>
        <div className="sync-pill">{syncMode}</div>
      </header>

      <section className="import-panel">
        <div>
          <p className="eyebrow">예약표 붙여넣기</p>
          <textarea value={reservationPaste} onChange={(event) => setReservationPaste(event.target.value)} />
        </div>
        <button type="button" onClick={() => void importReservations()}>예약표 추가</button>
        <button type="button" onClick={() => void resetPatients([])}>오늘 초기화</button>
      </section>

      <div className="main-grid">
        <PatientBoard
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelect={(patient) => setSelectedPatientId(patient.id)}
          onAdd={(name, appointmentTime) => void addPatient(name, appointmentTime)}
          onUpdate={(id, patch) => void updatePatient(id, patch)}
          onDelete={(id) => void deletePatient(id)}
          onMove={(id, direction) => void movePatient(id, direction)}
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

function readLocalStorageState<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorageState<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore persistence failures on locked-down clinic browsers.
  }
}
