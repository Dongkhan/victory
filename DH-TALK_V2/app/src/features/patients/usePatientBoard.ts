import { useCallback, useEffect, useRef, useState } from 'react';
import type { TodayPatient } from '../../domain/types';
import type { PatientRepository } from '../../data/patientRepository';
import { patientBoardReducer } from './patientBoardReducer';

interface UsePatientBoardArgs {
  date: string;
  repository: PatientRepository;
  fallbackRepository?: PatientRepository;
  fallbackPatients: TodayPatient[];
}

export function usePatientBoard({ date, repository, fallbackRepository, fallbackPatients }: UsePatientBoardArgs) {
  const fallbackPatientsRef = useRef(fallbackPatients);
  const [patients, setPatients] = useState<TodayPatient[]>(fallbackPatients);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const persistLocalPending = useCallback(
    async (patient: TodayPatient, reason: unknown) => {
      const pendingPatient: TodayPatient = { ...patient, syncState: 'pending' };
      if (fallbackRepository) await fallbackRepository.upsert(pendingPatient);
      setMutationError(`원격 저장 실패: ${reason instanceof Error ? reason.message : '알 수 없는 오류'} · 로컬 임시 저장됨`);
      return pendingPatient;
    },
    [fallbackRepository]
  );

  const upsertWithFailover = useCallback(
    async (patient: TodayPatient) => {
      try {
        const saved = await repository.upsert({ ...patient, syncState: undefined });
        setMutationError(null);
        return { ...saved, syncState: 'synced' as const };
      } catch (caught) {
        return persistLocalPending(patient, caught);
      }
    },
    [persistLocalPending, repository]
  );

  const persistAll = useCallback(
    async (nextPatients: TodayPatient[]) => {
      const saved = await Promise.all(nextPatients.map((patient) => upsertWithFailover(patient)));
      setPatients(saved);
    },
    [upsertWithFailover]
  );

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const next = await repository.listByDate(date);
      setPatients(next.length > 0 ? next : fallbackPatientsRef.current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '환자 목록을 불러오지 못했습니다.');
      const local = fallbackRepository ? await fallbackRepository.listByDate(date) : fallbackPatientsRef.current;
      setPatients(local.length > 0 ? local : fallbackPatientsRef.current);
    } finally {
      setLoading(false);
    }
  }, [date, fallbackRepository, repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addPatient(name: string, appointmentTime?: string) {
    const patient: TodayPatient = {
      id: createPatientId(),
      date,
      name,
      appointmentTime,
      status: 'waiting',
      sortOrder: patients.length + 1,
      operationalNote: ''
    };
    const saved = await upsertWithFailover(patient);
    setPatients((current) => [...current, saved].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async function bulkAddPatients(newPatients: Array<Omit<TodayPatient, 'id' | 'sortOrder'>>) {
    const startOrder = patients.length + 1;
    const rows = newPatients.map((patient, index) => ({
      ...patient,
      id: createPatientId(),
      sortOrder: startOrder + index
    }));
    const saved = await Promise.all(rows.map((patient) => upsertWithFailover(patient)));
    setPatients((current) => [...current, ...saved].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async function updatePatient(id: string, patch: Partial<TodayPatient>) {
    const target = patients.find((patient) => patient.id === id);
    if (!target) return;
    const updated = { ...target, ...patch };
    const saved = await upsertWithFailover(updated);
    setPatients((current) => current.map((patient) => (patient.id === id ? saved : patient)));
  }

  async function deletePatient(id: string) {
    try {
      await repository.delete(id);
      if (fallbackRepository) await fallbackRepository.delete(id);
      setMutationError(null);
      setPatients((current) => normalizeOrder(current.filter((patient) => patient.id !== id)));
    } catch (caught) {
      setMutationError(`원격 삭제 실패: ${caught instanceof Error ? caught.message : '알 수 없는 오류'} · 로컬 목록은 유지됨`);
    }
  }

  async function movePatient(id: string, direction: 'up' | 'down') {
    const next = patientBoardReducer(patients, { type: 'move', id, direction });
    await persistAll(next);
  }

  async function resetPatients(nextPatients: TodayPatient[]) {
    try {
      const existing = await repository.listByDate(date);
      await Promise.all(existing.map((patient) => repository.delete(patient.id)));
    } catch (caught) {
      setMutationError(`원격 초기화 실패: ${caught instanceof Error ? caught.message : '알 수 없는 오류'} · 새 목록은 로컬 임시 저장됨`);
    }
    const normalized = normalizeOrder(nextPatients.map((patient) => ({ ...patient, date })));
    await persistAll(normalized);
  }

  return {
    patients,
    loading,
    error,
    mutationError,
    refresh,
    addPatient,
    bulkAddPatients,
    updatePatient,
    deletePatient,
    movePatient,
    resetPatients
  };
}

function createPatientId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeOrder(patients: TodayPatient[]) {
  return [...patients]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((patient, index) => ({ ...patient, sortOrder: index + 1 }));
}
