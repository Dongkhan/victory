import { useCallback, useEffect, useRef, useState } from 'react';
import type { TodayPatient } from '../../domain/types';
import type { PatientRepository } from '../../data/patientRepository';
import { patientBoardReducer } from './patientBoardReducer';

interface UsePatientBoardArgs {
  date: string;
  repository: PatientRepository;
  fallbackPatients: TodayPatient[];
}

export function usePatientBoard({ date, repository, fallbackPatients }: UsePatientBoardArgs) {
  const fallbackPatientsRef = useRef(fallbackPatients);
  const [patients, setPatients] = useState<TodayPatient[]>(fallbackPatients);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistAll = useCallback(
    async (nextPatients: TodayPatient[]) => {
      await Promise.all(nextPatients.map((patient) => repository.upsert(patient)));
      setPatients(nextPatients);
    },
    [repository]
  );

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const next = await repository.listByDate(date);
      setPatients(next.length > 0 ? next : fallbackPatientsRef.current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '환자 목록을 불러오지 못했습니다.');
      setPatients(fallbackPatientsRef.current);
    } finally {
      setLoading(false);
    }
  }, [date, repository]);

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
    await repository.upsert(patient);
    setPatients((current) => [...current, patient].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async function bulkAddPatients(newPatients: Array<Omit<TodayPatient, 'id' | 'sortOrder'>>) {
    const startOrder = patients.length + 1;
    const rows = newPatients.map((patient, index) => ({
      ...patient,
      id: createPatientId(),
      sortOrder: startOrder + index
    }));
    await Promise.all(rows.map((patient) => repository.upsert(patient)));
    setPatients((current) => [...current, ...rows].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async function updatePatient(id: string, patch: Partial<TodayPatient>) {
    const target = patients.find((patient) => patient.id === id);
    if (!target) return;
    const updated = { ...target, ...patch };
    await repository.upsert(updated);
    setPatients((current) => current.map((patient) => (patient.id === id ? updated : patient)));
  }

  async function deletePatient(id: string) {
    await repository.delete(id);
    setPatients((current) => normalizeOrder(current.filter((patient) => patient.id !== id)));
  }

  async function movePatient(id: string, direction: 'up' | 'down') {
    const next = patientBoardReducer(patients, { type: 'move', id, direction });
    await persistAll(next);
  }

  async function resetPatients(nextPatients: TodayPatient[]) {
    const existing = await repository.listByDate(date);
    await Promise.all(existing.map((patient) => repository.delete(patient.id)));
    const normalized = normalizeOrder(nextPatients.map((patient) => ({ ...patient, date })));
    await persistAll(normalized);
  }

  return {
    patients,
    loading,
    error,
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
